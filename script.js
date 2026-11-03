document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  // Live Bengaluru clock; it reads the browser's IANA timezone data.
  const clock = $("#local-clock");
  const clockFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const updateClock = () => {
    if (clock) clock.textContent = clockFormatter.format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 1000);

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Reading progress.
  const progress = $("#reading-progress");
  let scrollTicking = false;
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (progress) progress.style.width = Math.min(100, Math.max(0, amount)) + "%";
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateProgress);
      scrollTicking = true;
    }
  }, { passive: true });
  updateProgress();

  // Mobile navigation.
  const menuButton = $("#mobile-menu");
  const nav = $("#main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      menuButton.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
      nav.classList.toggle("is-open", !open);
    });
    $$("#main-nav a").forEach((link) => link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
    }));
  }

  // Interactive canvas: a low-cost connected signal field, not a pre-rendered image.
  const canvas = $("#signal-canvas");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const host = canvas.parentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let points = [];
    const pointCount = 42;

    const resizeCanvas = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = [];
      for (let i = 0; i < pointCount; i += 1) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: i % 8 === 0 ? 2.3 : 1.2,
          phase: Math.random() * Math.PI * 2,
          accent: i % 8 === 0
        });
      }
      drawFrame(0);
    };

    const drawFrame = (time) => {
      ctx.clearRect(0, 0, width, height);
      const maxDistance = Math.min(width, height) * 0.29;

      points.forEach((point, index) => {
        if (!reducedMotion) {
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < 0 || point.x > width) point.vx *= -1;
          if (point.y < 0 || point.y > height) point.vy *= -1;
          point.x = Math.max(0, Math.min(width, point.x));
          point.y = Math.max(0, Math.min(height, point.y));
        }

        if (pointer.active) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 115 && distance > 1 && !reducedMotion) {
            point.x -= dx * 0.0008;
            point.y -= dy * 0.0008;
          }
        }

        for (let j = index + 1; j < points.length; j += 1) {
          const other = points[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < maxDistance) {
            const alpha = (1 - distance / maxDistance) * 0.25;
            ctx.strokeStyle = "rgba(107, 190, 164, " + alpha.toFixed(3) + ")";
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        const glow = point.accent ? 0.75 + Math.sin(time * 0.001 + point.phase) * 0.15 : 0.45;
        ctx.beginPath();
        ctx.fillStyle = point.accent ? "rgba(137,240,201," + glow.toFixed(2) + ")" : "rgba(142,188,255,0.48)";
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        ctx.fill();
      });

    };

    const animate = (time) => {
      drawFrame(time);
      if (!reducedMotion) frame = window.requestAnimationFrame(animate);
    };

    host.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });
    host.addEventListener("pointerleave", () => { pointer.active = false; });
    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();
    if (!reducedMotion) frame = window.requestAnimationFrame(animate);
    window.addEventListener("pagehide", () => window.cancelAnimationFrame(frame), { once: true });
  }

  // Project filters.
  const filters = $$(".filter[data-filter]");
  const cards = $$(".project-card[data-category]");
  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const category = filter.dataset.filter || "all";
      filters.forEach((button) => {
        const active = button === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      cards.forEach((card) => {
        card.hidden = category !== "all" && card.dataset.category !== category;
      });
    });
  });

  // Architecture explorer.
  const architectures = {
    agentic: {
      title: "LANGGRAPH / TOOL-CALLING PIPELINE",
      nodes: [
        { name: "User request", sub: "Input schema · conversation context", kind: "INPUT", type: "INPUT / ENTRYPOINT", description: "A request enters the workflow with its conversation context and relevant metadata.", responsibility: "Capture intent, validate required inputs and establish the execution context.", implementation: "Typed state, explicit input schemas and request-scoped identifiers.", stack: ["PYTHON", "FASTAPI", "PYDANTIC"] },
        { name: "Stateful orchestrator", sub: "Routing · state · conditional edges", kind: "CONTROL", type: "ORCHESTRATION / CONTROL PLANE", description: "The workflow coordinates each step and owns the state transitions between model reasoning and deterministic application code.", responsibility: "Route execution, manage state, enforce step boundaries and handle retries or alternate paths.", implementation: "A LangGraph state machine with explicit nodes, conditional edges and typed state.", stack: ["LANGGRAPH", "LANGCHAIN", "PYTHON"] },
        { name: "Model + tool selection", sub: "Structured output · tool calling", kind: "REASON", type: "MODEL / DECISION", description: "The model interprets context and proposes the next action using a constrained tool interface.", responsibility: "Produce structured outputs and select the appropriate tool without owning side effects.", implementation: "Schema-constrained tool calls, prompt/version management and model abstraction.", stack: ["LLM", "STRUCTURED OUTPUT", "AZURE OPENAI"] },
        { name: "Tools & internal APIs", sub: "Business logic · MCP · REST", kind: "EXECUTE", type: "EXECUTION / INTEGRATION", description: "The selected tool executes application behavior through an explicit contract.", responsibility: "Validate arguments, authorize actions, execute business logic and return typed results.", implementation: "Internal APIs, Python services, MCP servers and deterministic validation.", stack: ["MCP", "REST", "FASTAPI"] },
        { name: "Response + trace", sub: "Result · telemetry · evaluation", kind: "OBSERVE", type: "OUTPUT / OBSERVABILITY", description: "The result is assembled and the execution can be inspected through traces and evaluation signals.", responsibility: "Return a grounded response and capture latency, tool outcomes, failures and quality signals.", implementation: "Structured traces, conversation analytics and offline or online evaluation.", stack: ["LANGSMITH", "ELASTICSEARCH", "EVALS"] }
      ]
    },
    rag: {
      title: "MULTIMODAL RAG / DOCUMENT PIPELINE",
      nodes: [
        { name: "Source documents", sub: "PDF · images · tables · office files", kind: "SOURCE", type: "INGESTION / INPUT", description: "A set of heterogeneous enterprise documents enters the ingestion pipeline.", responsibility: "Accept supported formats, capture metadata and track source identity.", implementation: "Document IDs, source metadata and file-level processing state.", stack: ["PDF", "IMAGES", "METADATA"] },
        { name: "Parsing + normalization", sub: "Layout · OCR where needed · structure", kind: "PARSE", type: "DOCUMENT INTELLIGENCE", description: "Documents are parsed into structured elements while preserving useful layout and references.", responsibility: "Extract text, tables and visual structure while handling parsing failures.", implementation: "Docling pipelines, format-aware parsing and asynchronous processing.", stack: ["DOCLING", "PYTHON", "ASYNC IO"] },
        { name: "Chunk + embed + index", sub: "Semantic chunks · metadata · vectors", kind: "INDEX", type: "INDEXING / REPRESENTATION", description: "Parsed content is segmented into retrieval units and transformed into vector representations.", responsibility: "Choose chunk boundaries, attach metadata and write searchable records.", implementation: "Chunking policies, embedding models and a vector database.", stack: ["EMBEDDINGS", "VECTOR DB", "WEAVIATE"] },
        { name: "Retrieve + rerank", sub: "Query expansion · top-k · relevance", kind: "SEARCH", type: "RETRIEVAL / RANKING", description: "A user query retrieves candidate passages and ranks them by relevance to the task.", responsibility: "Balance recall and precision, filter by metadata and control context size.", implementation: "Hybrid or semantic retrieval, reranking and relevance evaluation.", stack: ["VECTOR SEARCH", "RERANKING", "FILTERS"] },
        { name: "Grounded generation", sub: "Context assembly · citations · answer", kind: "GENERATE", type: "GENERATION / RESPONSE", description: "The language model generates a response from retrieved context rather than relying only on parametric memory.", responsibility: "Assemble context, preserve source references and return a useful grounded answer.", implementation: "Context windows, prompt templates, source references and answer evaluation.", stack: ["LLM", "PROMPTING", "EVALUATION"] }
      ]
    },
    eval: {
      title: "LLM QUALITY / OBSERVABILITY LOOP",
      nodes: [
        { name: "Conversation / execution", sub: "Inputs · outputs · tool trajectory", kind: "EVENT", type: "OBSERVATION / SOURCE", description: "A production interaction emits a sequence of events that describe what the system did.", responsibility: "Capture the input, model output, tool calls, tool results and request metadata.", implementation: "Consistent event schemas and request-level correlation identifiers.", stack: ["EVENTS", "SCHEMAS", "TRACE ID"] },
        { name: "Trace collection", sub: "Spans · latency · errors · tokens", kind: "TRACE", type: "TRACING / DIAGNOSTICS", description: "The execution is represented as linked spans so engineers can see where time and failures occur.", responsibility: "Connect model and tool steps, surface latency and identify failure boundaries.", implementation: "Distributed trace concepts, LangSmith tracing and structured logs.", stack: ["LANGSMITH", "TRACING", "LOGS"] },
        { name: "Quality evaluation", sub: "Groundedness · relevance · correctness", kind: "EVAL", type: "EVALUATION / QUALITY", description: "Outputs are tested against defined quality criteria and representative evaluation cases.", responsibility: "Measure task success, retrieval relevance, faithfulness and failure categories.", implementation: "Evaluation datasets, rubric-based judges and deterministic assertions where possible.", stack: ["EVAL SETS", "LLM JUDGE", "ASSERTIONS"] },
        { name: "Analytics + diagnosis", sub: "Trends · cohorts · regressions", kind: "ANALYZE", type: "ANALYTICS / INSIGHT", description: "Evaluation and telemetry are aggregated to identify changes in system behavior over time.", responsibility: "Find regressions, compare model versions and prioritize high-impact failure patterns.", implementation: "Semantic telemetry, Elasticsearch analytics and dashboards.", stack: ["ELASTICSEARCH", "ANALYTICS", "DASHBOARDS"] },
        { name: "Improve + redeploy", sub: "Prompt · retrieval · model · workflow", kind: "ITERATE", type: "CONTINUOUS IMPROVEMENT", description: "Signals feed back into engineering changes and are verified before they are released.", responsibility: "Turn evidence into a change, rerun evaluation and observe the deployed result.", implementation: "Versioned prompts, regression suites, controlled rollout and post-deploy monitoring.", stack: ["CI", "REGRESSION TESTS", "DEPLOYMENT"] }
      ]
    }
  };

  const diagramFlow = $("#diagram-flow");
  const diagramTitle = $("#diagram-title");
  const inspectorId = $("#inspector-id");
  const inspectorKind = $("#inspector-kind");
  const inspectorTitle = $("#inspector-title");
  const inspectorDescription = $("#inspector-description");
  const inspectorResponsibility = $("#inspector-responsibility");
  const inspectorImplementation = $("#inspector-implementation");
  const inspectorStack = $("#inspector-stack");
  let activeArchitecture = "agentic";
  let activeNode = 0;

  const renderInspector = (node, index) => {
    if (!node) return;
    inspectorId.textContent = "N-" + String(index + 1).padStart(2, "0");
    inspectorKind.textContent = node.type;
    inspectorTitle.textContent = node.name;
    inspectorDescription.textContent = node.description;
    inspectorResponsibility.textContent = node.responsibility;
    inspectorImplementation.textContent = node.implementation;
    inspectorStack.replaceChildren();
    node.stack.forEach((item) => {
      const chip = document.createElement("span");
      chip.textContent = item;
      inspectorStack.appendChild(chip);
    });
    $$(".diagram-node", diagramFlow).forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };

  const renderArchitecture = (key) => {
    const architecture = architectures[key];
    if (!architecture || !diagramFlow) return;
    activeArchitecture = key;
    activeNode = 0;
    diagramTitle.textContent = architecture.title;
    diagramFlow.replaceChildren();
    architecture.nodes.forEach((node, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "diagram-node" + (index === 0 ? " is-selected" : "");
      button.setAttribute("aria-pressed", String(index === 0));
      button.innerHTML = '<span class="diagram-node-number">' + String(index + 1).padStart(2, "0") + '</span><span><span class="diagram-node-name"></span><span class="diagram-node-sub"></span></span><span class="diagram-node-kind"></span>';
      $(".diagram-node-name", button).textContent = node.name;
      $(".diagram-node-sub", button).textContent = node.sub;
      $(".diagram-node-kind", button).textContent = node.kind;
      button.addEventListener("click", () => {
        activeNode = index;
        renderInspector(node, index);
      });
      diagramFlow.appendChild(button);
      if (index < architecture.nodes.length - 1) {
        const connector = document.createElement("div");
        connector.className = "diagram-connector";
        connector.innerHTML = "<i></i><span>" + (key === "rag" ? "PROCESS / TRANSFORM" : key === "eval" ? "CAPTURE / ANALYZE" : "STATE TRANSITION") + "</span>";
        diagramFlow.appendChild(connector);
      }
    });
    renderInspector(architecture.nodes[0], 0);
  };

  $$(".lab-tab[data-architecture]").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".lab-tab").forEach((button) => {
        const active = button === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      renderArchitecture(tab.dataset.architecture);
    });
  });
  renderArchitecture(activeArchitecture);

  // Project case files.
  const caseFiles = {
    enterprise: {
      tag: "SOCIÉTÉ GÉNÉRALE / ENTERPRISE GENAI",
      title: "Productionizing intelligence",
      summary: "Engineering contributions to an enterprise GenAI platform used by 30,000+ employees. The platform reports 143,000+ employee hours of weekly productivity gains.",
      blocks: [
        ["01 / AGENTIC WORKFLOWS", "Designed and shipped five workflows using LangGraph state machines, LangChain, MCP, structured tool calling, internal APIs and external data integrations."],
        ["02 / MULTIMODAL RETRIEVAL", "Improved document ingestion throughput 4× through asynchronous processing, ProcessPoolExecutor parallelism and optimized Docling pipelines for PDFs, images and tables."],
        ["03 / MODEL ENGINEERING", "Worked on productionization of hosted and open-weight models, including inference optimization, quantization and QLoRA / PEFT fine-tuning."],
        ["04 / OBSERVABILITY", "Built evaluation and telemetry workflows involving conversation analytics, semantic telemetry, tracing and Elasticsearch analytics; contributed to a 20–25% improvement in production model evaluation."],
        ["ENGINEERING CONTEXT", "Internal platform implementation details are intentionally omitted. Metrics describe platform-level outcomes, not an individual attribution."]
      ],
      stack: ["PYTHON", "LANGGRAPH", "LANGCHAIN", "MCP", "FASTAPI", "AZURE OPENAI", "LLMOPS"],
      links: []
    },
    lifeadmin: {
      tag: "INDEPENDENT PROJECT / PYTHON",
      title: "LifeAdmin — local-first personal deadlines",
      summary: "A reminder system that works without an AI model. It exposes the same local data through a CLI, browser UI and MCP server, with SQLite as the persistence layer.",
      blocks: [
        ["ARCHITECTURE", "CLI / Web UI / optional Google ADK agent → MCP server → validation and reminder tools → local SQLite database."],
        ["MODEL BOUNDARY", "Gemma 4 E4B through local Ollama is an optional natural-language layer. The model interprets the request; deterministic Python validates dates and performs database changes."],
        ["ENGINEERING DECISIONS", "Clarify ambiguous dates instead of guessing, use local date and timezone context, keep mutations behind explicit tools, and retain a usable no-model workflow."],
        ["TESTING", "Deterministic tests cover persistence, CRUD operations, date validation, status filters and an actual MCP stdio client/server exchange. Model-backed evaluations inspect tool trajectories and final database state."]
      ],
      stack: ["PYTHON 3.11+", "SQLITE", "MCP SDK", "GOOGLE ADK", "GEMMA 4", "OLLAMA"],
      links: [{label:"OPEN GITHUB REPOSITORY",url:"https://github.com/Rasika020/LifeAdmin"}]
    },
    prooflens: {
      tag: "HACKATHON PROTOTYPE / COMPUTER VISION",
      title: "ProofLens — reconstruct and inspect diagrams",
      summary: "A prototype that turns flowchart images into structured graphs and makes the extracted result inspectable against the source.",
      blocks: [
        ["PIPELINE", "Flowchart image → node and label extraction → directed edges → structured graph → deterministic validation → interactive graph view."],
        ["CORE PRINCIPLE", "The model proposes the graph; application code validates structural consistency; users can inspect and correct uncertainty."],
        ["ENGINEERING FOCUS", "Preserve source-image navigation, represent uncertainty instead of hiding it, and validate the structure independently of model confidence."],
        ["SCOPE", "The initial prototype focuses on flowchart images. Multi-page PDFs, arbitrary diagram categories and advanced tactile interactions are future work, not current claims."]
      ],
      stack: ["COMPUTER VISION", "GRAPH REPRESENTATION", "PYTHON", "VALIDATION", "INTERACTIVE UI"],
      links: [{label:"OPEN GITHUB REPOSITORY",url:"https://github.com/Rasika020/ProofLens"}]
    },
    xfs: {
      tag: "SPONSORED ACADEMIC PROJECT / SYSTEMS",
      title: "File-level encryption support in XFS",
      summary: "An engineering project exploring file-level encryption support in the XFS filesystem, sponsored by Veritas Technologies.",
      blocks: [
        ["ENCRYPTION", "OpenSSL AES encryption to protect file contents."],
        ["INTEGRITY", "SHA-256 checks to verify file integrity."],
        ["KEY MANAGEMENT", "Communication with a key management server to handle key-related operations."],
        ["ENGINEERING DOMAIN", "Linux filesystem concepts, file-level security boundaries, cryptographic primitives and key lifecycle integration."]
      ],
      stack: ["LINUX", "XFS", "OPENSSL", "AES", "SHA-256", "KMS"],
      links: []
    }
  };

  const dialog = $("#project-dialog");
  const dialogContent = $("#dialog-content");
  const closeDialog = () => {
    if (dialog && dialog.open) dialog.close();
  };
  $$("[data-project]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = caseFiles[button.dataset.project];
      if (!item || !dialog || !dialogContent) return;
      dialogContent.replaceChildren();
      const tag = document.createElement("p");
      tag.className = "dialog-tag";
      tag.textContent = item.tag;
      const title = document.createElement("h2");
      title.id = "dialog-title";
      title.textContent = item.title;
      const summary = document.createElement("p");
      summary.textContent = item.summary;
      dialogContent.append(tag, title, summary);

      item.blocks.forEach((block) => {
        const section = document.createElement("section");
        section.className = "dialog-block";
        const heading = document.createElement("h3");
        heading.textContent = block[0];
        const paragraph = document.createElement("p");
        paragraph.textContent = block[1];
        section.append(heading, paragraph);
        dialogContent.appendChild(section);
      });

      const chips = document.createElement("div");
      chips.className = "card-chips";
      item.stack.forEach((value) => {
        const chip = document.createElement("span");
        chip.textContent = value;
        chips.appendChild(chip);
      });
      dialogContent.appendChild(chips);

      if (item.links.length) {
        const links = document.createElement("div");
        links.className = "dialog-links";
        item.links.forEach((link) => {
          const anchor = document.createElement("a");
          anchor.href = link.url;
          anchor.target = "_blank";
          anchor.rel = "noreferrer";
          anchor.textContent = link.label + " ↗";
          links.appendChild(anchor);
        });
        dialogContent.appendChild(links);
      }
      dialog.showModal();
    });
  });
  if (dialog) {
    $("#dialog-close").addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("close", () => {
      const lastButton = document.activeElement;
      if (lastButton && lastButton.blur) lastButton.blur();
    });
  }


  // Progressive reveal for content modules, without hiding content when JS is unavailable.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -24px 0px" });

    $(".project-card, .timeline-item, .stack-grid article, .boundary-grid article").forEach((element) => {
      element.classList.add("will-reveal");
      revealObserver.observe(element);
    });
  }

    // Working terminal. User input is only ever rendered as text.
  const terminalForm = $("#terminal-form");
  const terminalInput = $("#terminal-input");
  const terminalScreen = $("#terminal-screen");
  const commandHistory = [];
  let historyIndex = 0;
  const appendTerminalLine = (text, className) => {
    const line = document.createElement("p");
    if (className) line.className = className;
    line.textContent = text;
    terminalScreen.appendChild(line);
    terminalScreen.scrollTop = terminalScreen.scrollHeight;
  };
  const commandHelp = [
    "Available commands:",
    "  help       list commands",
    "  about      engineering profile",
    "  projects   selected project list",
    "  stack      technical toolkit",
    "  experience professional timeline",
    "  contact    contact links",
    "  clear      clear terminal output",
    "  open <id>  open a project case file (lifeadmin, prooflens, xfs)"
  ];

  const runCommand = (raw) => {
    const value = raw.trim();
    if (!value) return;
    appendTerminalLine("visitor@rasika:~$ " + value, "terminal-green");
    const parts = value.toLowerCase().split(/\s+/);
    const command = parts[0];
    const argument = parts[1] || "";

    if (command === "help") {
      commandHelp.forEach((line) => appendTerminalLine(line));
    } else if (command === "about") {
      appendTerminalLine("Rasika Devanhalli — Software Engineer focused on production GenAI, agentic workflows, backend systems and applied AI.", "terminal-blue");
      appendTerminalLine("Based in Bengaluru, India. Currently at Société Générale GSC.");
    } else if (command === "projects") {
      appendTerminalLine("01  Enterprise GenAI Platform  [professional work]");
      appendTerminalLine("02  LifeAdmin                 [local-first / MCP]");
      appendTerminalLine("03  ProofLens                 [computer vision / graph validation]");
      appendTerminalLine("04  XFS File-level Encryption [Linux / security]");
      appendTerminalLine("Use: open lifeadmin | open prooflens | open xfs");
    } else if (command === "stack") {
      appendTerminalLine("LANGUAGES  Python · Java · C · C# · SQL");
      appendTerminalLine("AI         LLMs · RAG · LangGraph · LangChain · MCP · QLoRA / PEFT");
      appendTerminalLine("BACKEND    FastAPI · REST · gRPC · PostgreSQL · MySQL · SQLite");
      appendTerminalLine("SYSTEMS    Linux · inference optimization · observability · Git");
    } else if (command === "experience") {
      appendTerminalLine("2024—NOW  Software Engineer — AI / Société Générale GSC");
      appendTerminalLine("2023      Software Engineer Intern / Microsoft Azure Networking");
      appendTerminalLine("2023—24   Project Intern / Veritas Technologies");
    } else if (command === "contact") {
      appendTerminalLine("EMAIL     rasikadevanhalli020@gmail.com");
      appendTerminalLine("GITHUB    github.com/Rasika020");
      appendTerminalLine("LINKEDIN  linkedin.com/in/rasika-devanhalli");
      appendTerminalLine("Use the contact links below to open a connection.", "terminal-blue");
    } else if (command === "clear") {
      terminalScreen.replaceChildren();
      return;
    } else if (command === "open") {
      if (argument === "lifeadmin" || argument === "prooflens" || argument === "xfs") {
        const target = $("[data-project='" + argument + "']");
        if (target) {
          target.click();
          appendTerminalLine("Opening case file: " + argument, "terminal-blue");
        }
      } else if (argument === "enterprise") {
        $("[data-project='enterprise']").click();
        appendTerminalLine("Opening enterprise case file. Private details are intentionally limited.", "terminal-blue");
      } else {
        appendTerminalLine("Unknown project. Try: open lifeadmin | open prooflens | open xfs", "terminal-amber");
      }
    } else {
      appendTerminalLine("Command not found: " + command + ". Type 'help' for available commands.", "terminal-amber");
    }
  };

  if (terminalForm && terminalInput && terminalScreen) {
    terminalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = terminalInput.value;
      if (!value.trim()) return;
      commandHistory.push(value);
      historyIndex = commandHistory.length;
      runCommand(value);
      terminalInput.value = "";
    });
    terminalInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" && commandHistory.length) {
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        terminalInput.value = commandHistory[historyIndex] || "";
      } else if (event.key === "ArrowDown" && commandHistory.length) {
        event.preventDefault();
        historyIndex = Math.min(commandHistory.length, historyIndex + 1);
        terminalInput.value = commandHistory[historyIndex] || "";
      }
    });
    $$(".terminal-suggestions [data-command]").forEach((button) => {
      button.addEventListener("click", () => {
        terminalInput.value = button.dataset.command;
        runCommand(terminalInput.value);
        terminalInput.value = "";
      });
    });
  }
});