/* Capitaxio admin: ek hi engine se bohat se admin pages chalte hain.
   Har page sirf ek chhoti window.PAGE = {...} setting deta hai (table, columns, form fields).
   Supabase se connect, admin login zaroori, aur likhna sirf admin ke liye (RLS se). */
(function () {
  var SUPABASE_URL = "https://zwffgoenruzcctkyptjg.supabase.co";
  var SUPABASE_KEY = "sb_publishable_6qL9pLwCjdfLAt6ftaSSTQ_SvWff4Ar";
  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var C = window.PAGE || {};
  var idKey = C.idKey || "id";
  var embedded = /[?&]embed=1/.test(window.location.search);
  var rows = [];
  var editingId = null;
  var app = document.getElementById("app");

  /* ---------- Style ---------- */
  var css =
    "*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}" +
    "body{background:#f4f6fc;color:#202943;padding:26px}" +
    ".head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:20px}" +
    ".head h1{font-size:24px;margin-bottom:7px}.head p{color:#858ba1;font-size:13px;line-height:1.6;max-width:640px}" +
    ".back{display:inline-block;margin-bottom:12px;font-size:12px;color:#6249cf;text-decoration:none}" +
    ".stats{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:18px}" +
    ".stat{background:#fff;border-radius:12px;padding:16px 20px;min-width:150px;box-shadow:0 4px 20px #1b28500a}" +
    ".stat p{color:#858ba1;font-size:12px;margin-bottom:8px}.stat h2{font-size:22px}" +
    ".panel{background:#fff;border-radius:13px;padding:20px;box-shadow:0 4px 20px #1b28500a;margin-bottom:18px}" +
    ".tools{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}" +
    ".tools input{flex:1;min-width:180px;padding:11px 13px;border:1px solid #e0e4ef;border-radius:8px;outline:none}" +
    ".btn{border:none;border-radius:8px;padding:11px 15px;font-size:13px;font-weight:bold;cursor:pointer}" +
    ".btn:disabled{opacity:.6;cursor:not-allowed}" +
    ".primary{background:#7058dc;color:#fff}.light{background:#eae6ff;color:#6249cf}" +
    ".ok{background:#e0f8ed;color:#168354}.off{background:#edf0f6;color:#59637a}.danger{background:#ffe5e8;color:#c6374b}" +
    ".wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:620px}" +
    "th{background:#f7f8fc;color:#777f98;font-size:12px;text-align:left;padding:13px 11px}" +
    "td{padding:13px 11px;border-bottom:1px solid #eef0f6;font-size:13px;vertical-align:middle;overflow-wrap:anywhere}" +
    ".pill{display:inline-block;padding:5px 9px;border-radius:20px;font-size:11px;font-weight:bold}" +
    ".yes,.approved,.active,.completed{background:#e0f8ed;color:#168354}" +
    ".no,.inactive{background:#edf0f6;color:#6f7890}.pending{background:#fff2d7;color:#9b6a08}" +
    ".rejected,.banned{background:#ffe5e8;color:#c6374b}" +
    ".actions{display:flex;gap:6px;flex-wrap:wrap}.actions .btn{padding:7px 10px;font-size:12px}" +
    ".empty{text-align:center;color:#858ba1;padding:30px}" +
    ".msg{display:none;margin-bottom:16px;padding:12px 14px;border-radius:9px;font-size:13px;line-height:1.6}" +
    ".msg.show{display:block}.msg.error{background:#ffe5e8;color:#c6374b}.msg.success{background:#e0f8ed;color:#168354}" +
    ".modal{display:none;position:fixed;inset:0;background:#10152dbb;z-index:50;justify-content:center;align-items:center;padding:16px}" +
    ".box{background:#fff;border-radius:14px;padding:24px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}" +
    ".box h2{margin-bottom:18px;font-size:19px}" +
    ".field{margin-bottom:15px}.field label{display:block;font-size:13px;font-weight:bold;margin-bottom:7px}" +
    ".field input[type=text],.field input[type=number],.field input[type=url],.field input[type=email],.field input[type=datetime-local],.field input[type=date],.field select,.field textarea{width:100%;padding:11px;border:1px solid #e0e4ef;border-radius:8px;outline:none;font-size:14px;background:#fff}" +
    ".field textarea{min-height:90px;resize:vertical}.field small{display:block;color:#858ba1;font-size:11px;margin-top:6px;line-height:1.5}" +
    ".check{display:flex;align-items:center;gap:10px}.check input{width:18px;height:18px}" +
    ".footer{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- Helpers ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function msg(text, type) {
    var m = document.getElementById("msgBox");
    if (!m) return;
    m.textContent = text || "";
    m.className = "msg" + (text ? " show " + (type || "") : "");
  }

  function toLocalInput(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function fmt(col, row) {
    var v = row[col.key];
    switch (col.type) {
      case "money": return "Rs " + Number(v || 0).toLocaleString("en-PK");
      case "date": return v ? new Date(v).toISOString().slice(0, 10) : "—";
      case "datetime": return v ? new Date(v).toLocaleString() : "—";
      case "bool": return v ? "Yes" : "No";
      case "id": return String(v || "").slice(0, 8).toUpperCase();
      default:
        if (v === null || v === undefined || v === "") return "—";
        var t = typeof v === "object" ? JSON.stringify(v) : String(v);
        return t.length > 90 ? t.slice(0, 90) + "…" : t;
    }
  }

  function cell(col, row) {
    var td = el("td");
    var text = fmt(col, row);
    if (col.type === "bool") {
      td.appendChild(el("span", "pill " + (row[col.key] ? "yes" : "no"), text));
    } else if (col.type === "badge") {
      td.appendChild(el("span", "pill " + String(row[col.key] || "").toLowerCase(), text));
    } else {
      td.textContent = text;
    }
    return td;
  }

  /* ---------- Admin login check ---------- */
  async function guard() {
    var s = (await db.auth.getSession()).data;
    if (!s.session) { window.location.replace("admin-login.html"); return false; }

    var a = (await db.from("admins").select("id")
      .eq("user_id", s.session.user.id).eq("is_active", true).maybeSingle()).data;

    if (!a) {
      await db.auth.signOut();
      window.location.replace("admin-login.html");
      return false;
    }
    document.body.style.visibility = "visible";
    return true;
  }

  /* ---------- Form ---------- */
  function buildField(f, value) {
    var wrap = el("div", "field");
    var id = "f_" + f.key;

    if (f.type === "checkbox") {
      var row = el("label", "check");
      var cb = el("input");
      cb.type = "checkbox"; cb.id = id; cb.checked = !!value;
      row.appendChild(cb);
      row.appendChild(document.createTextNode(f.label));
      wrap.appendChild(row);
    } else {
      var lab = el("label", "", f.label + (f.required ? " *" : ""));
      lab.setAttribute("for", id);
      wrap.appendChild(lab);

      var input;
      if (f.type === "textarea") {
        input = el("textarea");
        input.value = value == null ? "" : value;
      } else if (f.type === "select") {
        input = el("select");
        (f.options || []).forEach(function (o) {
          var opt = el("option", "", typeof o === "string" ? o : o.l);
          opt.value = typeof o === "string" ? o : o.v;
          input.appendChild(opt);
        });
        input.value = value == null ? (f.default !== undefined ? f.default : "") : value;
      } else {
        input = el("input");
        input.type = f.type === "datetime" ? "datetime-local" : (f.type || "text");
        if (f.type === "number") { input.step = f.step || "any"; if (f.min !== undefined) input.min = f.min; }
        input.value = f.type === "datetime" ? toLocalInput(value) : (value == null ? "" : value);
      }
      input.id = id;
      if (f.maxlength) input.maxLength = f.maxlength;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.required) input.required = true;
      wrap.appendChild(input);
    }

    if (f.help) wrap.appendChild(el("small", "", f.help));
    return wrap;
  }

  function readValues(fields) {
    var out = {};
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var input = document.getElementById("f_" + f.key);
      var v;
      if (f.type === "checkbox") {
        v = input.checked;
      } else if (f.type === "number") {
        v = input.value === "" ? null : Number(input.value);
      } else if (f.type === "datetime") {
        v = input.value ? new Date(input.value).toISOString() : null;
      } else {
        v = input.value.trim();
        if (v === "") v = f.required ? "" : null;
      }
      if (f.required && (v === "" || v === null)) {
        return { error: f.label + " zaroori hai." };
      }
      out[f.key] = v;
    }
    return { values: out };
  }

  /* ---------- Load ---------- */
  async function loadRows() {
    if (C.rpcList) {
      var rr = await db.rpc(C.rpcList);
      if (rr.error) { msg("Load nahi hua: " + rr.error.message, "error"); return; }
      rows = rr.data || [];
      renderTable();
      return;
    }
    var q = db.from(C.table).select(C.select || "*");
    (C.where || []).forEach(function (w) { q = q[w.op](w.col, w.val); });
    var order = C.orderBy || "created_at";
    var res = await q.order(order, { ascending: C.ascending === true }).limit(500);

    if (res.error) {
      // order wala column na ho to bina order ke dobara
      var q2 = db.from(C.table).select(C.select || "*");
      (C.where || []).forEach(function (w) { q2 = q2[w.op](w.col, w.val); });
      res = await q2.limit(500);
    }

    if (res.error) { msg("Load nahi hua: " + res.error.message, "error"); return; }
    rows = res.data || [];
    renderTable();
  }

  /* ---------- List page ---------- */
  function columns() {
    if (C.columns) return C.columns;
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter(function (k) {
      return typeof rows[0][k] !== "object" || rows[0][k] === null;
    }).slice(0, 7).map(function (k) {
      return { key: k, label: k.replace(/_/g, " ") };
    });
  }

  function renderTable() {
    var body = document.getElementById("tbody");
    var head = document.getElementById("thead");
    var term = (document.getElementById("search") || { value: "" }).value.trim().toLowerCase();
    var cols = columns();

    var filtered = rows.filter(function (r) {
      if (!term) return true;
      var keys = C.searchKeys || cols.map(function (c) { return c.key; });
      return keys.some(function (k) { return String(r[k] == null ? "" : r[k]).toLowerCase().indexOf(term) !== -1; });
    });

    head.textContent = "";
    var trh = el("tr");
    cols.forEach(function (c) { trh.appendChild(el("th", "", c.label)); });
    var hasActions = C.canEdit || C.toggleKey || C.canDelete;
    if (hasActions) trh.appendChild(el("th", "", "Action"));
    head.appendChild(trh);

    body.textContent = "";
    if (!filtered.length) {
      var tr = el("tr");
      var td = el("td", "empty", rows.length ? "Koi matching record nahi mila." : "Abhi koi record nahi hai.");
      td.colSpan = cols.length + (hasActions ? 1 : 0) || 1;
      tr.appendChild(td);
      body.appendChild(tr);
    }

    filtered.forEach(function (r) {
      var tr = el("tr");
      cols.forEach(function (c) { tr.appendChild(cell(c, r)); });

      if (hasActions) {
        var td = el("td");
        var box = el("div", "actions");

        if (C.canEdit) {
          var e = el("button", "btn light", "Edit"); e.type = "button";
          e.addEventListener("click", function () { openForm(r); });
          box.appendChild(e);
        }
        if (C.toggleKey) {
          var on = !!r[C.toggleKey];
          var t = el("button", "btn " + (on ? "off" : "ok"), on ? "Disable" : "Enable"); t.type = "button";
          t.addEventListener("click", function () { toggleRow(r, t); });
          box.appendChild(t);
        }
        if (C.canDelete) {
          var d = el("button", "btn danger", "Delete"); d.type = "button";
          d.addEventListener("click", function () { deleteRow(r, d); });
          box.appendChild(d);
        }
        td.appendChild(box);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    });

    var total = document.getElementById("statTotal");
    if (total) total.textContent = rows.length;
    var act = document.getElementById("statActive");
    if (act && C.toggleKey) act.textContent = rows.filter(function (r) { return !!r[C.toggleKey]; }).length;
  }

  async function toggleRow(r, btn) {
    btn.disabled = true;
    var upd = {}; upd[C.toggleKey] = !r[C.toggleKey];
    var res = await db.from(C.table).update(upd).eq(idKey, r[idKey]).select(idKey);
    if (res.error || !res.data || !res.data.length) {
      btn.disabled = false;
      msg("Tabdeeli nahi hui: " + (res.error ? res.error.message : "admin permission check karein"), "error");
      return;
    }
    msg("Update ho gaya.", "success");
    loadRows();
  }

  async function deleteRow(r, btn) {
    if (!confirm("Ye record hamesha ke liye hat jayega. Pakka delete karna hai?")) return;
    btn.disabled = true;
    var res = await db.from(C.table).delete().eq(idKey, r[idKey]).select(idKey);
    if (res.error || !res.data || !res.data.length) {
      btn.disabled = false;
      msg("Delete nahi hua: " + (res.error ? res.error.message : "admin permission check karein"), "error");
      return;
    }
    msg("Record delete ho gaya.", "success");
    loadRows();
  }

  /* ---------- Add / Edit modal ---------- */
  function openForm(row) {
    editingId = row ? row[idKey] : null;
    var fields = (!row && C.rpcAdd && C.rpcAdd.fields) ? C.rpcAdd.fields : C.form;
    var modal = document.getElementById("modal");
    var form = document.getElementById("modalForm");
    form.textContent = "";

    document.getElementById("modalTitle").textContent = row ? "Edit" : (C.addLabel || "Add New");

    fields.forEach(function (f) {
      var val = row ? row[f.key] : (f.default !== undefined ? f.default : null);
      form.appendChild(buildField(f, val));
    });

    var foot = el("div", "footer");
    var cancel = el("button", "btn off", "Cancel"); cancel.type = "button";
    cancel.addEventListener("click", closeForm);
    var save = el("button", "btn primary", "Save"); save.type = "submit"; save.id = "saveBtn";
    foot.appendChild(cancel); foot.appendChild(save);
    form.appendChild(foot);

    form.onsubmit = function (ev) { ev.preventDefault(); saveForm(fields); };
    modal.style.display = "flex";
  }

  function closeForm() {
    document.getElementById("modal").style.display = "none";
    editingId = null;
  }

  async function saveForm(fields) {
    var r = readValues(fields);
    if (r.error) { alert(r.error); return; }

    var btn = document.getElementById("saveBtn");
    btn.disabled = true;
    var res;

    if (!editingId && C.rpcAdd) {
      var params = {};
      Object.keys(C.rpcAdd.params).forEach(function (p) { params[p] = r.values[C.rpcAdd.params[p]]; });
      res = await db.rpc(C.rpcAdd.name, params);
      btn.disabled = false;
      if (res.error) { alert("Nahi hua: " + res.error.message); return; }
    } else if (editingId) {
      res = await db.from(C.table).update(r.values).eq(idKey, editingId).select(idKey);
      btn.disabled = false;
      if (res.error || !res.data || !res.data.length) {
        alert("Save nahi hua: " + (res.error ? res.error.message : "admin permission check karein"));
        return;
      }
    } else {
      var ins = Object.assign({}, r.values, C.insertExtra || {});
      res = await db.from(C.table).insert(ins).select(idKey);
      btn.disabled = false;
      if (res.error || !res.data || !res.data.length) {
        alert("Save nahi hua: " + (res.error ? res.error.message : "admin permission check karein"));
        return;
      }
    }

    closeForm();
    msg("Save ho gaya.", "success");
    loadRows();
  }

  /* ---------- Single settings page ---------- */
  async function buildSingle() {
    var form = document.getElementById("singleForm");
    var res = await db.from(C.table).select("*").eq(idKey, C.idValue).maybeSingle();
    if (res.error || !res.data) {
      msg("Settings load nahi huin: " + (res.error ? res.error.message : "row nahi mili"), "error");
      return;
    }
    var row = res.data;
    form.textContent = "";
    C.form.forEach(function (f) { form.appendChild(buildField(f, row[f.key])); });

    var foot = el("div", "footer");
    var save = el("button", "btn primary", "Save Settings"); save.type = "submit"; save.id = "saveBtn";
    foot.appendChild(save);
    form.appendChild(foot);

    form.onsubmit = async function (ev) {
      ev.preventDefault();
      var r = readValues(C.form);
      if (r.error) { msg(r.error, "error"); return; }

      save.disabled = true;
      r.values.updated_at = new Date().toISOString();
      var up = await db.from(C.table).update(r.values).eq(idKey, C.idValue).select(idKey);
      save.disabled = false;

      if (up.error || !up.data || !up.data.length) {
        msg("Save nahi hua: " + (up.error ? up.error.message : "admin permission check karein"), "error");
      } else {
        msg("Settings save ho gayin.", "success");
      }
    };
  }

  /* ---------- Page banana ---------- */
  function build() {
    app.textContent = "";

    if (!embedded) {
      var back = el("a", "back", "← Admin Dashboard");
      back.href = "admin.html";
      app.appendChild(back);
    }

    var head = el("div", "head");
    var left = el("div");
    left.appendChild(el("h1", "", C.title || "Page"));
    if (C.description) left.appendChild(el("p", "", C.description));
    head.appendChild(left);

    if (C.mode !== "single" && (C.canAdd || C.rpcAdd)) {
      var add = el("button", "btn primary", C.addLabel || "+ Add New"); add.type = "button";
      add.addEventListener("click", function () { openForm(null); });
      head.appendChild(add);
    }
    app.appendChild(head);

    var m = el("div", "msg"); m.id = "msgBox"; app.appendChild(m);

    if (C.mode === "single") {
      var panel = el("div", "panel");
      var form = el("form"); form.id = "singleForm";
      form.appendChild(el("p", "empty", "Loading..."));
      panel.appendChild(form);
      app.appendChild(panel);
      buildSingle();
      return;
    }

    var stats = el("div", "stats");
    var s1 = el("div", "stat"); s1.appendChild(el("p", "", "Total")); var h1 = el("h2", "", "0"); h1.id = "statTotal"; s1.appendChild(h1);
    stats.appendChild(s1);
    if (C.toggleKey) {
      var s2 = el("div", "stat"); s2.appendChild(el("p", "", "Active")); var h2 = el("h2", "", "0"); h2.id = "statActive"; s2.appendChild(h2);
      stats.appendChild(s2);
    }
    app.appendChild(stats);

    var panel2 = el("div", "panel");
    var tools = el("div", "tools");
    var search = el("input"); search.type = "search"; search.id = "search"; search.placeholder = "Search..."; search.autocomplete = "off";
    search.addEventListener("input", renderTable);
    var refresh = el("button", "btn light", "↻ Refresh"); refresh.type = "button";
    refresh.addEventListener("click", loadRows);
    tools.appendChild(search); tools.appendChild(refresh);
    panel2.appendChild(tools);

    var wrap = el("div", "wrap");
    var table = el("table");
    var thead = el("thead"); thead.id = "thead";
    var tbody = el("tbody"); tbody.id = "tbody";
    table.appendChild(thead); table.appendChild(tbody);
    wrap.appendChild(table);
    panel2.appendChild(wrap);
    app.appendChild(panel2);

    var modal = el("div", "modal"); modal.id = "modal";
    var box = el("div", "box");
    var title = el("h2", "", "Add New"); title.id = "modalTitle";
    var mform = el("form"); mform.id = "modalForm";
    box.appendChild(title); box.appendChild(mform);
    modal.appendChild(box);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeForm(); });
    app.appendChild(modal);

    loadRows();
  }

  guard().then(function (ok) { if (ok) build(); });
})();