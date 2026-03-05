import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: string[] = [];

    // 1. Create test club
    const testClubId = "11111111-1111-1111-1111-111111111111";
    const { error: clubError } = await supabase
      .from("clubs")
      .upsert({ id: testClubId, name: "Clube Teste", slug: "clube-teste" }, { onConflict: "id" });
    if (clubError) throw new Error(`Club: ${clubError.message}`);
    results.push("✅ Clube Teste criado");

    // 2. Create admin user
    const adminEmail = "admin@clubeteste.com";
    const adminPassword = "teste123456";
    let adminUserId: string;

    const { data: existingAdmin } = await supabase.auth.admin.listUsers();
    const foundAdmin = existingAdmin?.users?.find((u) => u.email === adminEmail);

    if (foundAdmin) {
      adminUserId = foundAdmin.id;
      results.push("⚠️ Admin já existia, reusando");
    } else {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: "Admin Teste", role: "club_admin" },
      });
      if (adminError) throw new Error(`Admin user: ${adminError.message}`);
      adminUserId = adminData.user.id;
      results.push("✅ Usuário admin criado");
    }

    // Create admin profile
    await supabase.from("profiles").upsert(
      { user_id: adminUserId, name: "Admin Teste", email: adminEmail },
      { onConflict: "user_id" }
    );

    // Create admin role
    await supabase.from("user_roles").upsert(
      { user_id: adminUserId, role: "club_admin", club_id: testClubId },
      { onConflict: "user_id,role" }
    );
    results.push("✅ Role club_admin atribuída");

    // 3. Create test athletes (10 athletes)
    const fakeAthletes = [
      { name: "João Silva", email: "joao@clubeteste.com", gender: "male", birth_date: "1998-03-15", category: "GF" },
      { name: "Maria Santos", email: "maria@clubeteste.com", gender: "female", birth_date: "2000-07-22", category: "GF" },
      { name: "Pedro Oliveira", email: "pedro@clubeteste.com", gender: "male", birth_date: "1999-11-08", category: "SC" },
      { name: "Ana Costa", email: "ana@clubeteste.com", gender: "female", birth_date: "2001-01-30", category: "GF" },
      { name: "Lucas Ferreira", email: "lucas@clubeteste.com", gender: "male", birth_date: "1997-05-12", category: "OE" },
      { name: "Camila Souza", email: "camila@clubeteste.com", gender: "female", birth_date: "2002-09-18", category: "SC" },
      { name: "Rafael Lima", email: "rafael@clubeteste.com", gender: "male", birth_date: "1996-12-03", category: "GF" },
      { name: "Juliana Pereira", email: "juliana@clubeteste.com", gender: "female", birth_date: "2000-04-25", category: "OE" },
      { name: "Bruno Almeida", email: "bruno@clubeteste.com", gender: "male", birth_date: "1998-08-14", category: "SC" },
      { name: "Fernanda Rocha", email: "fernanda@clubeteste.com", gender: "female", birth_date: "2001-06-07", category: "GF" },
    ];

    const athleteRows = fakeAthletes.map((a) => ({ ...a, club_id: testClubId }));
    const { data: insertedAthletes, error: athError } = await supabase
      .from("athletes")
      .upsert(athleteRows, { onConflict: "email" })
      .select("id, email, name");
    if (athError) throw new Error(`Athletes: ${athError.message}`);
    results.push(`✅ ${insertedAthletes?.length || 0} atletas criados`);

    // 4. Create athlete auth user (first athlete: João Silva)
    const athleteEmail = "joao@clubeteste.com";
    const athletePassword = "teste123456";

    const foundAthlete = existingAdmin?.users?.find((u) => u.email === athleteEmail);
    if (!foundAthlete) {
      const { error: athUserError } = await supabase.auth.admin.createUser({
        email: athleteEmail,
        password: athletePassword,
        email_confirm: true,
        user_metadata: { name: "João Silva", role: "athlete" },
      });
      if (athUserError && !athUserError.message.includes("already")) {
        results.push(`⚠️ Erro criando user atleta: ${athUserError.message}`);
      } else {
        results.push("✅ Usuário atleta (joao@clubeteste.com) criado");
      }
    } else {
      results.push("⚠️ Usuário atleta já existia");
    }

    // Get athlete IDs for relationships
    const { data: allAthletes } = await supabase
      .from("athletes")
      .select("id, email, name, gender")
      .eq("club_id", testClubId)
      .is("deleted_at", null);

    if (!allAthletes || allAthletes.length === 0) {
      throw new Error("No athletes found after insert");
    }

    const athleteMap = new Map(allAthletes.map((a) => [a.email, a]));
    const athleteIds = allAthletes.map((a) => a.id);
    const maleAthletes = allAthletes.filter((a) => a.gender === "male");
    const femaleAthletes = allAthletes.filter((a) => a.gender === "female");

    // 5. Create events (past and future)
    const events = [
      { name: "Treino Masculino", event_type: "training", training_type: "principal", gender: "male", location: "Quadra Principal", start_datetime: "2026-03-01T19:00:00-03:00", end_datetime: "2026-03-01T21:00:00-03:00" },
      { name: "Treino Feminino", event_type: "training", training_type: "principal", gender: "female", location: "Quadra Principal", start_datetime: "2026-03-02T19:00:00-03:00", end_datetime: "2026-03-02T21:00:00-03:00" },
      { name: "Treino Extra Masc", event_type: "training", training_type: "extra", gender: "male", location: "Quadra B", start_datetime: "2026-03-03T18:00:00-03:00", end_datetime: "2026-03-03T20:00:00-03:00" },
      { name: "Campeonato Regional", event_type: "championship", training_type: null, gender: "both", location: "Ginásio Municipal", start_datetime: "2026-03-08T09:00:00-03:00", end_datetime: "2026-03-08T18:00:00-03:00" },
      { name: "Confraternização", event_type: "social", training_type: null, gender: "both", location: "Sede do Clube", start_datetime: "2026-03-15T14:00:00-03:00", end_datetime: "2026-03-15T22:00:00-03:00" },
      { name: "Treino Masc Futuro", event_type: "training", training_type: "principal", gender: "male", location: "Quadra Principal", start_datetime: "2026-03-10T19:00:00-03:00", end_datetime: "2026-03-10T21:00:00-03:00" },
      { name: "Treino Fem Futuro", event_type: "training", training_type: "principal", gender: "female", location: "Quadra Principal", start_datetime: "2026-03-11T19:00:00-03:00", end_datetime: "2026-03-11T21:00:00-03:00" },
      { name: "Treino Misto", event_type: "training", training_type: "principal", gender: "both", location: "Quadra Principal", start_datetime: "2026-03-12T19:00:00-03:00", end_datetime: "2026-03-12T21:00:00-03:00" },
    ];

    const eventRows = events.map((e) => ({ ...e, club_id: testClubId, created_by: adminUserId }));
    const { data: insertedEvents, error: evError } = await supabase
      .from("events")
      .upsert(eventRows, { onConflict: "id" })
      .select("id, name, gender, event_type, start_datetime");
    if (evError) throw new Error(`Events: ${evError.message}`);
    results.push(`✅ ${insertedEvents?.length || 0} eventos criados`);

    // 6. Create attendances for past events
    const pastEvents = insertedEvents?.filter((e) => new Date(e.start_datetime) < new Date()) || [];
    const attendanceRows: any[] = [];
    const statuses = ["present", "absent", "justified"];

    for (const event of pastEvents) {
      const relevantAthletes = event.gender === "male" ? maleAthletes : event.gender === "female" ? femaleAthletes : allAthletes;
      for (const athlete of relevantAthletes) {
        const randomStatus = statuses[Math.floor(Math.random() * 3)];
        attendanceRows.push({
          event_id: event.id,
          athlete_id: athlete.id,
          club_id: testClubId,
          status: randomStatus,
          marked_by: adminUserId,
          marked_at: event.start_datetime,
        });
      }
    }

    if (attendanceRows.length > 0) {
      const { error: attError } = await supabase
        .from("attendances")
        .upsert(attendanceRows, { onConflict: "id" });
      if (attError) results.push(`⚠️ Attendances: ${attError.message}`);
      else results.push(`✅ ${attendanceRows.length} presenças registradas`);
    }

    // 7. Create training confirmations for future events
    const futureTrainings = insertedEvents?.filter(
      (e) => e.event_type === "training" && new Date(e.start_datetime) >= new Date()
    ) || [];
    const confirmationRows: any[] = [];

    for (const event of futureTrainings) {
      const relevantAthletes = event.gender === "male" ? maleAthletes : event.gender === "female" ? femaleAthletes : allAthletes;
      for (const athlete of relevantAthletes) {
        if (Math.random() > 0.3) {
          confirmationRows.push({
            event_id: event.id,
            athlete_id: athlete.id,
            club_id: testClubId,
            status: Math.random() > 0.2 ? "confirmed" : "declined",
          });
        }
      }
    }

    if (confirmationRows.length > 0) {
      const { error: confError } = await supabase
        .from("training_confirmations")
        .upsert(confirmationRows, { onConflict: "id" });
      if (confError) results.push(`⚠️ Confirmations: ${confError.message}`);
      else results.push(`✅ ${confirmationRows.length} confirmações de treino`);
    }

    // 8. Create debts
    const debtDescriptions = ["Mensalidade Março", "Uniforme", "Inscrição Campeonato", "Material Esportivo", "Mensalidade Fevereiro"];
    const debtRows: any[] = [];

    for (let i = 0; i < Math.min(athleteIds.length, 7); i++) {
      const desc = debtDescriptions[i % debtDescriptions.length];
      const isPaid = Math.random() > 0.5;
      const amount = [50, 100, 150, 200, 80][Math.floor(Math.random() * 5)];
      debtRows.push({
        athlete_id: athleteIds[i],
        club_id: testClubId,
        description: desc,
        amount,
        due_date: `2026-03-${String(15 + i).padStart(2, "0")}`,
        paid_at: isPaid ? new Date().toISOString() : null,
        paid_amount: isPaid ? amount : null,
        created_by: adminUserId,
      });
    }

    if (debtRows.length > 0) {
      const { error: debtError } = await supabase.from("debts").upsert(debtRows, { onConflict: "id" });
      if (debtError) results.push(`⚠️ Debts: ${debtError.message}`);
      else results.push(`✅ ${debtRows.length} dívidas criadas`);
    }

    // 9. Create rotation duties
    const rotationRows: any[] = [];
    for (let day = 6; day <= 12; day++) {
      const idx1 = (day - 6) % athleteIds.length;
      const idx2 = (day - 5) % athleteIds.length;
      rotationRows.push({
        duty_date: `2026-03-${String(day).padStart(2, "0")}`,
        athlete1_id: athleteIds[idx1],
        athlete2_id: athleteIds[idx2],
        club_id: testClubId,
      });
    }

    if (rotationRows.length > 0) {
      const { error: rotError } = await supabase.from("rotation_duties").upsert(rotationRows, { onConflict: "id" });
      if (rotError) results.push(`⚠️ Rotation: ${rotError.message}`);
      else results.push(`✅ ${rotationRows.length} escalas de rodízio`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        credentials: {
          admin: { email: adminEmail, password: adminPassword },
          athlete: { email: athleteEmail, password: athletePassword },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
