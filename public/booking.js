// Widget de marcação (Cal.com por trás, via /api/slots e /api/bookings no
// nosso servidor — a chave da API nunca chega ao browser). Os textos fixos
// (labels) usam o sistema data-i18n do site; os textos gerados aqui em JS
// (dias, horas, mensagens de estado) têm o seu próprio pequeno dicionário,
// porque são criados depois de a página carregar e o data-i18n só troca
// texto já presente no HTML.
(function () {
  const STRINGS = {
    "pt-PT": {
      loading: "A carregar horários disponíveis…",
      noSlots: "Sem horários disponíveis nos próximos dias. Escreva-nos diretamente.",
      pickDay: "Escolha um dia",
      pickTime: "Escolha uma hora",
      change: "‹ Mudar dia/hora",
      submitting: "A confirmar…",
      success: "Reunião marcada. Enviámos a confirmação para o seu email.",
      error: "Não foi possível completar a marcação. Tente outra vez.",
      loadError: "Não foi possível carregar os horários. Tente recarregar a página.",
    },
    en: {
      loading: "Loading available times…",
      noSlots: "No available times in the coming days. Write to us directly.",
      pickDay: "Pick a day",
      pickTime: "Pick a time",
      change: "‹ Change day/time",
      submitting: "Confirming…",
      success: "Meeting booked. We've sent the confirmation to your email.",
      error: "We couldn't complete the booking. Please try again.",
      loadError: "We couldn't load the available times. Try reloading the page.",
    },
  };

  function t(key) {
    const lang = document.documentElement.lang === "en" ? "en" : "pt-PT";
    return STRINGS[lang][key];
  }
  function locale() {
    return document.documentElement.lang === "en" ? "en-GB" : "pt-PT";
  }

  const widget = document.getElementById("booking-widget");
  if (!widget) return;

  const statusEl = document.getElementById("booking-status");
  const daysEl = document.getElementById("booking-days");
  const timesEl = document.getElementById("booking-times");
  const changeLink = document.getElementById("booking-change");
  const formEl = document.getElementById("booking-form");
  const attendeeForm = document.getElementById("booking-attendee-form");
  const msgEl = document.getElementById("booking-msg");

  let slotsByDay = {};
  let selectedDay = null;
  let selectedStart = null;

  function fmtDay(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return new Intl.DateTimeFormat(locale(), { weekday: "short", day: "numeric", month: "short" }).format(d);
  }
  function fmtTime(iso, timeZone) {
    return new Intl.DateTimeFormat(locale(), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(iso));
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderDays() {
    clear(daysEl);
    const days = Object.keys(slotsByDay).filter((d) => slotsByDay[d].length > 0);
    if (!days.length) {
      statusEl.textContent = t("noSlots");
      return;
    }
    statusEl.textContent = t("pickDay");
    days.forEach((day) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = fmtDay(day);
      btn.addEventListener("click", () => selectDay(day, btn));
      daysEl.appendChild(btn);
    });
    daysEl.style.display = "flex";
  }

  function selectDay(day, btn) {
    selectedDay = day;
    selectedStart = null;
    Array.from(daysEl.children).forEach((c) => c.classList.remove("hl"));
    btn.classList.add("hl");
    formEl.style.display = "none";
    changeLink.style.display = "none";
    renderTimes();
  }

  function renderTimes() {
    clear(timesEl);
    statusEl.textContent = t("pickTime");
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
    slotsByDay[selectedDay].forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = fmtTime(slot.start, tz);
      btn.addEventListener("click", () => selectTime(slot.start, btn));
      timesEl.appendChild(btn);
    });
    timesEl.style.display = "flex";
  }

  function selectTime(iso, btn) {
    selectedStart = iso;
    Array.from(timesEl.children).forEach((c) => c.classList.remove("hl"));
    btn.classList.add("hl");
    formEl.style.display = "flex";
    changeLink.style.display = "inline-block";
    changeLink.textContent = t("change");
  }

  function resetSelection() {
    selectedDay = null;
    selectedStart = null;
    clear(timesEl);
    timesEl.style.display = "none";
    formEl.style.display = "none";
    changeLink.style.display = "none";
    Array.from(daysEl.children).forEach((c) => c.classList.remove("hl"));
    statusEl.textContent = t("pickDay");
  }

  function loadSlots() {
    statusEl.textContent = t("loading");
    daysEl.style.display = "none";
    timesEl.style.display = "none";
    formEl.style.display = "none";
    changeLink.style.display = "none";

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 13);
    const toStr = (d) => d.toISOString().slice(0, 10);

    const qs = new URLSearchParams({ start: toStr(start), end: toStr(end), timeZone: tz });
    fetch("/api/slots?" + qs)
      .then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then((data) => {
        slotsByDay = data && data.data ? data.data : {};
        renderDays();
      })
      .catch(() => {
        statusEl.textContent = t("loadError");
      });
  }

  if (changeLink) {
    changeLink.addEventListener("click", (e) => {
      e.preventDefault();
      resetSelection();
    });
  }

  if (attendeeForm) {
    attendeeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!selectedStart) return;
      const submitBtn = document.getElementById("booking-submit");
      const name = document.getElementById("bk-nome").value.trim();
      const email = document.getElementById("bk-email").value.trim();
      const company = document.getElementById("bk-empresa").value.trim();
      const notes = document.getElementById("bk-notas").value.trim();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";

      submitBtn.disabled = true;
      msgEl.textContent = t("submitting");

      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: selectedStart, name, email, company, notes, timeZone: tz }),
      })
        .then(async (r) => {
          const body = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(body.error || t("error"));
          widget.innerHTML = "";
          const done = document.createElement("p");
          done.className = "ledger-text";
          done.style.fontSize = "17px";
          done.textContent = t("success");
          widget.appendChild(done);
        })
        .catch((err) => {
          submitBtn.disabled = false;
          msgEl.textContent = err.message || t("error");
        });
    });
  }

  loadSlots();

  // Se a língua mudar a meio do fluxo, atualiza os textos gerados por JS
  // (o data-i18n do resto do site trata do texto estático sozinho).
  const langToggle = document.getElementById("lang-toggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      setTimeout(() => {
        if (!selectedDay) {
          statusEl.textContent = Object.keys(slotsByDay).some((d) => slotsByDay[d].length) ? t("pickDay") : t("noSlots");
          Array.from(daysEl.children).forEach((btn, i) => {
            const day = Object.keys(slotsByDay).filter((d) => slotsByDay[d].length > 0)[i];
            if (day) btn.textContent = fmtDay(day);
          });
        } else {
          statusEl.textContent = t("pickTime");
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
          Array.from(timesEl.children).forEach((btn, i) => {
            const slot = slotsByDay[selectedDay][i];
            if (slot) btn.textContent = fmtTime(slot.start, tz);
          });
        }
        if (changeLink.style.display !== "none") changeLink.textContent = t("change");
      }, 0);
    });
  }
})();
