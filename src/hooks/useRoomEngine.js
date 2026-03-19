import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export function useRoomEngine(id, user, authLoading) {
  const [tournament, setTournament] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [role, setRole] = useState("spectator");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);

  // ✅ FIX: refs للـ intervals — cleanup صحيح بدون memory leak
  const countdownIntervalRef = useRef(null);
  const restoreIntervalRef   = useRef(null);

  // ✅ Cleanup عند unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (restoreIntervalRef.current)   clearInterval(restoreIntervalRef.current);
    };
  }, []);

  // ── Load room data ──────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !id || !user) return;

    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", id)
          .single();

        if (tournamentError) throw tournamentError;
        setTournament(tournamentData);

        // ✅ FIX: cleanup interval قبل ما نخلق واحد جديد
        if (restoreIntervalRef.current) clearInterval(restoreIntervalRef.current);

        if (tournamentData.status === "live" && tournamentData.end_time) {
          const remaining = Math.max(
            0,
            Math.floor((new Date(tournamentData.end_time) - new Date()) / 1000)
          );
          setCountdown(remaining);
          if (remaining > 0) {
            let secs = remaining;
            restoreIntervalRef.current = setInterval(() => {
              secs -= 1;
              setCountdown(secs);
              if (secs <= 0) {
                clearInterval(restoreIntervalRef.current);
                restoreIntervalRef.current = null;
                setCountdown(0);
              }
            }, 1000);
          }
        }

        const { data: membersData, error: membersError } = await supabase
          .from("room_members")
          .select(`
            id,
            user_id,
            team_number,
            seat_number,
            is_ready,
            created_at,
            profiles!room_members_user_id_fkey (
              full_name,
              free_fire_id,
              avatar_url
            )
          `)
          .eq("tournament_id", id)
          .order("team_number", { ascending: true })
          .order("seat_number", { ascending: true });

        if (membersError) throw membersError;
        setMembers(membersData || []);
        setReadyCount(membersData?.filter(m => m.is_ready).length || 0);

        if (user?.id) {
          const { data: statsData } = await supabase
            .from("player_stats")
            .select("*")
            .eq("user_id", user.id);
          setPlayerStats(statsData?.[0] || null);
        }

        // Determine role
        if (user?.id) {
          if (tournamentData.created_by === user.id) {
            setRole("organizer");
          } else {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .maybeSingle();

            const isPrivileged = ["admin", "fondateur", "super_admin", "founder"].includes(
              profileData?.role
            );

            if (isPrivileged) {
              setRole("organizer");
            } else {
              const isMember = membersData?.some(m => m.user_id === user.id);
              setRole(isMember ? "participant" : "spectator");
            }
          }
        } else {
          setRole("spectator");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [id, user, authLoading]);

  // ── Load messages ───────────────────────────────────────────────
  useEffect(() => {
    if (loading || !id || role === "spectator") return;

    const loadMessages = async () => {
      try {
        const { data, error: msgError } = await supabase
          .from("room_messages")
          .select(`
            id,
            message,
            created_at,
            user_id,
            profiles!room_messages_user_id_fkey (
              full_name,
              free_fire_id,
              avatar_url
            )
          `)
          .eq("tournament_id", id)
          .order("created_at", { ascending: true })
          .limit(50);

        if (msgError) throw msgError;
        setMessages(data || []);
      } catch (err) {
        if (retryCount < 3) {
          setTimeout(() => setRetryCount(prev => prev + 1), 3000);
        }
      }
    };

    loadMessages();
  }, [id, role, retryCount, loading]);

  // ── Realtime: members + tournament changes ──────────────────────
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`room-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `tournament_id=eq.${id}` },
        async () => {
          const { data: membersData } = await supabase
            .from("room_members")
            .select(`
              id, user_id, team_number, seat_number, is_ready, created_at,
              profiles!room_members_user_id_fkey ( full_name, free_fire_id, avatar_url )
            `)
            .eq("tournament_id", id)
            .order("team_number", { ascending: true })
            .order("seat_number", { ascending: true });

          setMembers(membersData || []);
          setReadyCount(membersData?.filter(m => m.is_ready).length || 0);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tournaments", filter: `id=eq.${id}` },
        async () => {
          const { data: tData } = await supabase
            .from("tournaments")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (tData) setTournament(tData);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  // ── Realtime: new messages ──────────────────────────────────────
  useEffect(() => {
    if (!id || (role !== "participant" && role !== "organizer")) return;

    const channel = supabase
      .channel(`room-messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `tournament_id=eq.${id}` },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, free_fire_id, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, profiles: profile }];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, role]);

  // ── Swap state ──────────────────────────────────────────────────
  const [swapRequest, setSwapRequest] = useState(null);
  const [incomingSwap, setIncomingSwap] = useState(null);

  useEffect(() => {
    if (!id || !user) return;

    const swapChannel = supabase
      .channel(`swap-${id}`)
      .on("broadcast", { event: "swap_request" }, ({ payload }) => {
        const myMember = members.find(m => m.user_id === user.id);
        if (
          myMember &&
          payload.toTeam === myMember.team_number &&
          payload.toSeat === myMember.seat_number &&
          payload.fromUserId !== user.id
        ) {
          setIncomingSwap(payload);
        }
      })
      .on("broadcast", { event: "swap_cancelled" }, ({ payload }) => {
        setIncomingSwap(prev =>
          prev?.fromUserId === payload.fromUserId ? null : prev
        );
      })
      .on("broadcast", { event: "swap_response" }, ({ payload }) => {
        if (payload.toUserId === user.id) {
          if (payload.accepted) {
            doSwapExecution(payload.fromTeam, payload.fromSeat, payload.toTeam, payload.toSeat);
          } else {
            setSwapRequest(null);
            alert("❌ Swap refusé.");
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(swapChannel);
  }, [id, user, members]);

  const requestSwap = async (toTeam, toSeat, toPlayer) => {
    if (role !== "participant" || tournament?.status !== "open") return;
    const myMember = members.find(m => m.user_id === user.id);
    if (!myMember) return;

    setSwapRequest({ toTeam, toSeat, toPlayer });

    await supabase.channel(`swap-${id}`).send({
      type: "broadcast",
      event: "swap_request",
      payload: {
        fromUserId: user.id,
        fromName: myMember.profiles?.full_name || "Quelqu'un",
        fromTeam: myMember.team_number,
        fromSeat: myMember.seat_number,
        toTeam,
        toSeat,
      },
    });
  };

  const cancelSwapRequest = async () => {
    if (!swapRequest) return;
    await supabase.channel(`swap-${id}`).send({
      type: "broadcast",
      event: "swap_cancelled",
      payload: { fromUserId: user.id },
    });
    setSwapRequest(null);
  };

  const respondToSwap = async (accepted) => {
    if (!incomingSwap) return;
    const myMember = members.find(m => m.user_id === user.id);
    if (!myMember) return;

    await supabase.channel(`swap-${id}`).send({
      type: "broadcast",
      event: "swap_response",
      payload: {
        accepted,
        toUserId: incomingSwap.fromUserId,
        fromTeam: myMember.team_number,
        fromSeat: myMember.seat_number,
        toTeam: incomingSwap.fromTeam,
        toSeat: incomingSwap.fromSeat,
      },
    });

    if (accepted) {
      doSwapExecution(
        myMember.team_number,
        myMember.seat_number,
        incomingSwap.fromTeam,
        incomingSwap.fromSeat
      );
    }
    setIncomingSwap(null);
  };

  // ✅ FIX: swap execution صحيح — 3 steps لتجنب unique constraint
  const doSwapExecution = async (teamA, seatA, teamB, seatB) => {
    const memberA = members.find(m => m.team_number === teamA && m.seat_number === seatA);
    const memberB = members.find(m => m.team_number === teamB && m.seat_number === seatB);
    if (!memberA || !memberB) return;

    try {
      // Step 1: A → temp seat 99 (avoid unique conflict)
      await supabase.from("room_members")
        .update({ team_number: 99, seat_number: 99 })
        .eq("tournament_id", id)
        .eq("user_id", memberA.user_id);

      // Step 2: B → A's old position
      await supabase.from("room_members")
        .update({ team_number: teamA, seat_number: seatA })
        .eq("tournament_id", id)
        .eq("user_id", memberB.user_id);

      // Step 3: A → B's old position
      await supabase.from("room_members")
        .update({ team_number: teamB, seat_number: seatB })
        .eq("tournament_id", id)
        .eq("user_id", memberA.user_id);

      setSwapRequest(null);
    } catch (err) {
      console.error("Swap execution error:", err);
    }
  };

  // ── changeSeat ──────────────────────────────────────────────────
  const changeSeat = async (teamNumber, seatNumber) => {
    if (role !== "participant") return;
    if (tournament?.status !== "open") return;

    const existingMember = members.find(
      m => m.team_number === teamNumber && m.seat_number === seatNumber
    );

    if (existingMember) {
      requestSwap(teamNumber, seatNumber, existingMember);
      return;
    }

    const currentMember = members.find(m => m.user_id === user.id);
    if (!currentMember) return;

    // Optimistic update
    setMembers(prev =>
      prev.map(m =>
        m.user_id === user.id
          ? { ...m, team_number: teamNumber, seat_number: seatNumber }
          : m
      )
    );

    const { error: seatError } = await supabase
      .from("room_members")
      .update({ team_number: teamNumber, seat_number: seatNumber })
      .eq("tournament_id", id)
      .eq("user_id", user.id);

    if (seatError) {
      // Rollback
      setMembers(prev =>
        prev.map(m => (m.user_id === user.id ? { ...currentMember } : m))
      );
      alert("Impossible de changer de siège: " + seatError.message);
    }
  };

  // ── toggleReady ─────────────────────────────────────────────────
  const toggleReady = async () => {
    if (role !== "participant") return;

    const currentMember = members.find(m => m.user_id === user.id);
    if (!currentMember) return;

    const newReadyState = !currentMember.is_ready;

    // Optimistic update
    setMembers(prev =>
      prev.map(m =>
        m.user_id === user.id ? { ...m, is_ready: newReadyState } : m
      )
    );
    setReadyCount(prev => (newReadyState ? prev + 1 : prev - 1));

    const { error: readyError } = await supabase
      .from("room_members")
      .update({ is_ready: newReadyState })
      .eq("tournament_id", id)
      .eq("user_id", user.id);

    if (readyError) {
      // Rollback
      setMembers(prev =>
        prev.map(m =>
          m.user_id === user.id ? { ...m, is_ready: currentMember.is_ready } : m
        )
      );
      setReadyCount(prev => (currentMember.is_ready ? prev + 1 : prev - 1));
    }
  };

  // ── sendMessage ─────────────────────────────────────────────────
  const sendMessage = async (message) => {
    if (role === "spectator" || !message.trim()) return;

    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      message: message.trim(),
      created_at: new Date().toISOString(),
      user_id: user.id,
      profiles: {
        full_name: user.user_metadata?.full_name || "Vous",
        free_fire_id: "",
        avatar_url: null,
      },
    };

    setMessages(prev => [...prev, tempMessage]);

    const { error: sendError } = await supabase.from("room_messages").insert([
      { tournament_id: id, user_id: user.id, message: message.trim() },
    ]);

    if (sendError) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ── lockRoom ────────────────────────────────────────────────────
  const lockRoom = async () => {
    if (role !== "organizer") return;
    const { error: lockError } = await supabase
      .from("tournaments")
      .update({ status: "locked" })
      .eq("id", id);
    if (!lockError) setTournament(prev => ({ ...prev, status: "locked" }));
  };

  // ── startMatch ─────────────────────────────────────────────────
  // ✅ FIX: cleanup interval existant avant d'en créer un nouveau
  const startMatch = async (durationMinutes = 20) => {
    if (role !== "organizer") return;

    const now      = new Date();
    const endTime  = new Date(now.getTime() + durationMinutes * 60000);
    const deadline = new Date(endTime.getTime() + 10 * 60000);

    await supabase.from("tournaments").update({
      status:          "live",
      room_status:     "live",
      start_time:      now.toISOString(),
      match_duration:  durationMinutes,
      end_time:        endTime.toISOString(),
      result_deadline: deadline.toISOString(),
    }).eq("id", id);

    setTournament(prev => ({
      ...prev,
      status: "live",
      room_status: "live",
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      result_deadline: deadline.toISOString(),
      match_duration: durationMinutes,
    }));

    // ✅ FIX: cleanup قبل ما نخلق interval جديد
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (restoreIntervalRef.current)   clearInterval(restoreIntervalRef.current);

    let secs = durationMinutes * 60;
    setCountdown(secs);

    countdownIntervalRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(0);
      }
    }, 1000);
  };

  // ── kickPlayer ─────────────────────────────────────────────────
  const kickPlayer = async (userId) => {
    if (role !== "organizer") return;
    await supabase
      .from("room_members")
      .delete()
      .eq("tournament_id", id)
      .eq("user_id", userId);
  };

  // ── generateTeamStructure ───────────────────────────────────────
  const generateTeamStructure = () => {
    if (!tournament) return [];

    const { mode, max_players, game_type, cs_format } = tournament;
    let teamSize, numTeams;

    if (game_type === "cs") {
      numTeams = 2;
      const fmt = cs_format || mode || "4v4";
      teamSize = fmt === "1v1" ? 1 : fmt === "2v2" ? 2 : 4;
    } else {
      teamSize = mode === "squad" ? 4 : mode === "duo" ? 2 : 1;
      numTeams = Math.ceil(max_players / teamSize);
    }

    const teams = [];
    for (let team = 1; team <= numTeams; team++) {
      const teamSeats = [];
      for (let seat = 1; seat <= teamSize; seat++) {
        const member = members.find(
          m => m.team_number === team && m.seat_number === seat
        );
        teamSeats.push({
          seatNumber: seat,
          player: member
            ? {
                id: member.user_id,
                full_name: member.profiles?.full_name || "Inconnu",
                free_fire_id: member.profiles?.free_fire_id || "",
                avatar_url: member.profiles?.avatar_url || null,
                isReady: member.is_ready || false,
              }
            : null,
        });
      }
      teams.push({ teamNumber: team, seats: teamSeats });
    }

    return teams;
  };

  const teams = generateTeamStructure();

  return {
    tournament,
    members,
    teams,
    messages,
    role,
    loading,
    error,
    readyCount,
    countdown,
    playerStats,
    selectedPlayer,
    setSelectedPlayer,
    changeSeat,
    swapRequest,
    incomingSwap,
    requestSwap,
    cancelSwapRequest,
    respondToSwap,
    toggleReady,
    sendMessage,
    lockRoom,
    startMatch,
    kickPlayer,
    setTournament,
  };
}