(function () {
  const data = window.STUDY_DATA;
  const root = document.getElementById("view-root");
  const title = document.getElementById("page-title");
  const todayLabel = document.getElementById("today-label");
  const storageKey = "odontostudy-progress";
  const progress = JSON.parse(localStorage.getItem(storageKey) || "{}");
  let quiz = { questions: [], index: 0, answers: {}, finished: false };

  todayLabel.textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long"
  }).format(new Date());

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function saveProgress() {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }

  function updateProgress() {
    const answered = Object.keys(progress).length;
    const percent = data.questions.length ? Math.round(answered / data.questions.length * 100) : 0;
    document.getElementById("progress-percent").textContent = percent + "%";
    document.getElementById("answered-count").textContent = answered + " de " + data.questions.length + " respondidas";
    document.getElementById("progress-ring").style.setProperty("--progress", percent + "%");
  }

  function setView(view, heading) {
    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.view === view);
    });
    title.textContent = heading;
  }

  function iconForTopic(titleText) {
    if (/biosseg|cárie|biofilme/i.test(titleText)) return "✦";
    if (/saliva/i.test(titleText)) return "◉";
    if (/eros/i.test(titleText)) return "≈";
    if (/cultiv|identifica/i.test(titleText)) return "⌕";
    if (/infec|pulpar/i.test(titleText)) return "＋";
    if (/viral/i.test(titleText)) return "◎";
    if (/fúng/i.test(titleText)) return "◌";
    if (/hpv|artigo/i.test(titleText)) return "§";
    if (/anatom/i.test(titleText)) return "♙";
    return "●";
  }

  function isCariesSection(text) {
    return /^\d+\.\s+(?:O que é cárie|O papel do biofilme na cárie|Os microrganismos da cárie|Os ácidos da cárie|pH, desmineralização e remineralização|Saliva: protetora contra cárie|Dieta e cárie|Cárie × Erosão|Prevenção e controle)/.test(text);
  }

  function renderDashboard() {
    setView("dashboard", "Bom estudo!");
    const topicCards = data.topics.map(topic => {
      const sectionCount = topic.content.filter(isCariesSection).length;
      const studyCount = topic.id === "tema-carie" && sectionCount
        ? `${sectionCount} seções de estudo`
        : `${topic.content.length} tópicos de estudo`;
      return `
        <article class="topic-card" data-topic="${topic.id}">
          <div class="topic-icon">${iconForTopic(topic.title)}</div>
          <h3>${escapeHtml(topic.title)}</h3>
          <p>${studyCount}</p>
        </article>
      `;
    }).join("");

    root.innerHTML = `
      <div class="hero">
        <section class="hero-card">
          <div>
            <p>Próxima sessão</p>
            <h2>Revise um tema e teste seus conhecimentos</h2>
            <button class="primary-button" id="start-study">Começar a estudar</button>
          </div>
          <div class="hero-art">♢</div>
        </section>
        <section class="stats-grid">
          <article class="stat-card"><span>Temas</span><strong>${data.topics.length}</strong></article>
          <article class="stat-card"><span>Questões</span><strong>${data.questions.length}</strong></article>
          <article class="stat-card"><span>Materiais</span><strong>${data.sources.length}</strong></article>
        </section>
      </div>
      <div class="section-heading">
        <h2>Todos os assuntos</h2>
      </div>
      <div class="topics-grid">${topicCards}</div>
    `;

    document.getElementById("start-study").addEventListener("click", () => renderStudy(data.topics[0].id));
    document.querySelectorAll(".topic-card").forEach(card => {
      card.addEventListener("click", () => renderStudy(card.dataset.topic));
    });
  }

  function renderStudy(topicId) {
    setView("study", "Estudar");
    const activeId = topicId || data.topics[0].id;
    const topic = data.topics.find(item => item.id === activeId) || data.topics[0];
    const content = topic.content.map(text => {
      if (topic.id === "tema-carie" && isCariesSection(text)) {
        return `<h3 class="content-heading">${escapeHtml(text)}</h3>`;
      }
      if (topic.id === "tema-carie" && text.startsWith("⚠ PEGADINHA:")) {
        return `<p class="study-callout"><strong>Pegadinha:</strong>${escapeHtml(text.slice("⚠ PEGADINHA:".length))}</p>`;
      }
      return `<p>${escapeHtml(text)}</p>`;
    }).join("");
    root.innerHTML = `
      <div class="study-layout">
        <aside class="panel topic-list">
          ${data.topics.map(item => `
            <button class="${item.id === topic.id ? "active" : ""}" data-topic="${item.id}">
              ${escapeHtml(item.title)}
            </button>
          `).join("")}
        </aside>
        <article class="panel">
          <h2>${escapeHtml(topic.title)}</h2>
          <div class="content-list">${content}</div>
        </article>
      </div>
    `;
    root.querySelectorAll(".topic-list button").forEach(button => {
      button.addEventListener("click", () => renderStudy(button.dataset.topic));
    });
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startQuiz() {
    quiz = { questions: shuffle(data.questions).slice(0, 10), index: 0, answers: {}, finished: false };
    renderQuiz();
  }

  function renderQuiz() {
    setView("quiz", "Simulado");
    if (quiz.finished) {
      const correct = Object.values(quiz.answers).filter(answer => answer.correct).length;
      root.innerHTML = `
        <section class="quiz-card">
          <p class="eyebrow">Resultado</p>
          <h2>Você acertou ${correct} de ${quiz.questions.length} questões</h2>
          <p>${correct >= 7 ? "Excelente desempenho. Continue revisando os temas com menor acerto." : "Bom começo. Revise os assuntos principais e tente outro simulado."}</p>
          <button class="primary-button" id="retry-quiz">Novo simulado</button>
        </section>
      `;
      document.getElementById("retry-quiz").addEventListener("click", startQuiz);
      return;
    }

    const question = quiz.questions[quiz.index];
    if (!question) {
      quiz.finished = true;
      renderQuiz();
      return;
    }
    const selected = quiz.answers[question.id]?.key;
    const answered = Boolean(selected);
    const percent = ((quiz.index + 1) / quiz.questions.length) * 100;

    root.innerHTML = `
      <section class="quiz-card">
        <div class="quiz-progress">
          <span>Questão ${quiz.index + 1} de ${quiz.questions.length}</span>
          <div class="quiz-progress-line"><span style="width:${percent}%"></span></div>
        </div>
        <h2>${escapeHtml(question.prompt)}</h2>
        <div class="options">
          ${question.options.map(option => {
            let state = "";
            if (answered && option.key === selected) state = option.key === question.answer ? " correct" : " incorrect";
            if (answered && option.key === question.answer) state = " correct";
            return `
              <button class="option${state}" data-key="${option.key}" ${answered ? "disabled" : ""}>
                <span class="option-key">${option.key}</span>
                <span>${escapeHtml(option.text)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${answered ? `<div class="explanation"><strong>${quiz.answers[question.id].correct ? "Resposta correta." : "Resposta incorreta."}</strong><br>${escapeHtml(question.explanation)}</div>` : ""}
        <div class="quiz-actions">
          <button class="secondary-button" id="exit-quiz">Sair</button>
          <button class="primary-button" id="next-question" ${answered ? "" : "disabled"}>
            ${quiz.index === quiz.questions.length - 1 ? "Ver resultado" : "Próxima"}
          </button>
        </div>
      </section>
    `;

    root.querySelectorAll(".option").forEach(button => {
      button.addEventListener("click", () => {
        const key = button.dataset.key;
        const correct = key === question.answer;
        quiz.answers[question.id] = { key, correct };
        progress[question.id] = correct;
        saveProgress();
        updateProgress();
        renderQuiz();
      });
    });
    document.getElementById("exit-quiz").addEventListener("click", renderDashboard);
    document.getElementById("next-question").addEventListener("click", () => {
      quiz.index++;
      if (quiz.index >= quiz.questions.length) quiz.finished = true;
      renderQuiz();
    });
  }

  function renderSources() {
    setView("sources", "Materiais");
    root.innerHTML = `
      <div class="section-heading">
        <h2>Biblioteca do curso</h2>
        <span class="eyebrow">${data.sources.length} arquivos únicos</span>
      </div>
      <div class="sources-grid">
        ${data.sources.map(source => `
          <article class="source-card">
            <div class="source-type">${escapeHtml(source.type)}</div>
            <div>
              <h3>${escapeHtml(source.name)}</h3>
              <p>${source.copies > 1 ? source.copies + " cópias · " : ""}${Math.max(1, Math.round(source.sizeBytes / 1024))} KB</p>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.view === "dashboard") renderDashboard();
      if (button.dataset.view === "study") renderStudy();
      if (button.dataset.view === "quiz") startQuiz();
      if (button.dataset.view === "sources") renderSources();
    });
  });

  document.getElementById("theme-button").addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  updateProgress();
  renderDashboard();
})();
