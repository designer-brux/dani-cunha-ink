import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

gsap.registerPlugin(ScrollTrigger);

// ===============================
// CONFIGURAÇÃO DO CANVAS
// ===============================
const canvas = document.querySelector("#cenario3d");

if (!canvas) {
  console.error("Canvas #cenario3d não encontrado no HTML.");
}

// ===============================
// RENDERIZADOR
// ===============================
const renderizador = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});

renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1;
renderizador.outputColorSpace = THREE.SRGBColorSpace;
renderizador.autoClear = false;

// ===============================
// CENA PRINCIPAL 3D
// ===============================
const cena = new THREE.Scene();

const camara = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

camara.position.z = 5;

// ===============================
// CENA DO FUNDO FLUIDO
// ===============================
const cenaFundo = new THREE.Scene();
const cameraFundo = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const materialFundo = new THREE.ShaderMaterial({
  depthWrite: false,
  depthTest: false,

  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  },

  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    precision mediump float;

    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
             (c - a) * u.y * (1.0 - u.x) +
             (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;

      float dist = distance(uv, uMouse);

      // Distorção próxima ao mouse
      uv += (uv - uMouse) * 0.50 * exp(-dist * 4.0);

      float n1 = noise(uv * 2.5 + uTime * 0.18);
      float n2 = noise(uv * 5.0 - uTime * 0.08);

      float n = mix(n1, n2, 0.35);

      vec3 preto = vec3(0.005, 0.005, 0.007);
      vec3 vinho = vec3(0.12, 0.00, 0.04);
      vec3 roxo = vec3(0.04, 0.00, 0.08);

      vec3 color = mix(preto, vinho, n * 1.25);
      color = mix(color, roxo, smoothstep(0.15, 0.95, dist) * 0.9);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const meshFundo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materialFundo);
cenaFundo.add(meshFundo);

// ===============================
// LUZES DA CENA 3D
// ===============================
const luzAmbiente = new THREE.AmbientLight(0xffffff, 2);
cena.add(luzAmbiente);

const luzDirecional = new THREE.DirectionalLight(0xffffff, 3);
luzDirecional.position.set(5, 5, 5);
cena.add(luzDirecional);

const luzPreenchimento = new THREE.DirectionalLight(0xffffff, 3);
luzPreenchimento.position.set(-5, 0, -5);
cena.add(luzPreenchimento);

// ===============================
// MODELO 3D
// ===============================
const grupoModelo = new THREE.Group();
cena.add(grupoModelo);

const carregador = new GLTFLoader();

carregador.load(
  "/modelo.glb",

  function (gltf) {
    const modeloArte = gltf.scene;

    modeloArte.scale.set(2, 2, 2);
    modeloArte.position.set(0, 0, 0);

    grupoModelo.add(modeloArte);

    console.log("Modelo 3D carregado com sucesso.");
  },

  function (progresso) {
    if (progresso.total > 0) {
      const porcentagem = (progresso.loaded / progresso.total) * 100;
      console.log(`Carregando modelo: ${porcentagem.toFixed(0)}%`);
    }
  },

  function (erro) {
    console.error("Erro ao carregar o modelo 3D:", erro);
  },
);

// ===============================
// ANIMAÇÃO DO MODELO COM SCROLL
// ===============================
// Agora a rotação termina antes da seção de orçamento.
// Assim o modelo não tenta continuar até o footer.
gsap.to(grupoModelo.rotation, {
  y: Math.PI * 6,
  x: Math.PI * 2,
  z: 0,
  scrollTrigger: {
    trigger: "main",
    start: "top top",
    endTrigger: "#orcamento",
    end: "top bottom",
    scrub: 1.2,
  },
});

// ===============================
// INTERAÇÃO COM MOUSE
// ===============================
window.addEventListener("mousemove", (e) => {
  materialFundo.uniforms.uMouse.value.x = e.clientX / window.innerWidth;
  materialFundo.uniforms.uMouse.value.y = 1 - e.clientY / window.innerHeight;
});

// ===============================
// LOOP DE RENDERIZAÇÃO
// ===============================
let renderizar3D = true;

function animar() {
  requestAnimationFrame(animar);

  materialFundo.uniforms.uTime.value += 0.01;

  renderizador.clear();

  // 1. Renderiza o fundo fluido
  renderizador.render(cenaFundo, cameraFundo);

  // 2. Limpa profundidade para o modelo não ser bloqueado pelo fundo
  renderizador.clearDepth();

  // 3. Renderiza o modelo 3D apenas quando permitido
  if (renderizar3D) {
    renderizador.render(cena, camara);
  }
}

animar();

// ===============================
// LIGAR / DESLIGAR O MODELO 3D POR SEÇÃO
// ===============================
// O fundo fluido continua ativo.
// Apenas o modelo 3D é desligado antes do orçamento/footer.
ScrollTrigger.create({
  trigger: "#orcamento",
  start: "top bottom",

  onEnter: () => {
    renderizar3D = false;
  },

  onLeaveBack: () => {
    renderizar3D = true;
  },
});

// ===============================
// RESIZE
// ===============================
window.addEventListener("resize", () => {
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderizador.setSize(window.innerWidth, window.innerHeight);

  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();

  materialFundo.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight,
  );

  ScrollTrigger.refresh();
});

// ===============================
// CABEÇALHO INTELIGENTE
// ===============================
const cabecalho = document.querySelector("#meu-cabecalho");
let ultimoScroll = 0;

if (cabecalho) {
  window.addEventListener("scroll", () => {
    const scrollAtual = window.scrollY;

    if (scrollAtual <= 0) {
      cabecalho.classList.remove("escondido");
      ultimoScroll = scrollAtual;
      return;
    }

    if (scrollAtual > ultimoScroll) {
      cabecalho.classList.add("escondido");
    } else {
      cabecalho.classList.remove("escondido");
    }

    ultimoScroll = scrollAtual;
  });
}

// ===============================
// MENU HAMBURGER
// ===============================
const btnMenu = document.querySelector("#btn-menu");
const menuNavegacao = document.querySelector("#menu-navegacao");
const linksMenu = document.querySelectorAll(".navegacao a");

if (btnMenu && menuNavegacao) {
  btnMenu.addEventListener("click", () => {
    menuNavegacao.classList.toggle("ativa");
    btnMenu.classList.toggle("ativo");
  });

  linksMenu.forEach((link) => {
    link.addEventListener("click", () => {
      menuNavegacao.classList.remove("ativa");
      btnMenu.classList.remove("ativo");
    });
  });
}

// ===============================
// ANIMAÇÕES DE SCROLL — SOBRE
// ===============================
const elementosAnimar = document.querySelectorAll(".animar-scroll");

if (elementosAnimar.length > 0) {
  elementosAnimar.forEach((elemento) => {
    gsap.fromTo(
      elemento,
      {
        opacity: 0,
        y: 100,
      },
      {
        opacity: 1,
        y: 0,
        duration: 2.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: elemento,
          start: "top 85%",
        },
      },
    );
  });
}

// ===============================
// STICKY SCROLL — DIFERENCIAIS
// ===============================
const blocosTexto = document.querySelectorAll(".bloco-dif");
const imagensFundo = document.querySelectorAll(".img-diferencial");

if (blocosTexto.length > 0 && imagensFundo.length > 0) {
  blocosTexto.forEach((bloco, index) => {
    ScrollTrigger.create({
      trigger: bloco,
      start: "top center",
      end: "bottom center",

      onToggle: (self) => {
        if (self.isActive && imagensFundo[index]) {
          imagensFundo.forEach((img) => img.classList.remove("ativa"));
          imagensFundo[index].classList.add("ativa");
        }
      },
    });
  });
}

// ===============================
// CARROSSEL INFINITO E LIGHTBOX
// ===============================
const pista = document.querySelector("#pista-portfolio");
const janelaLightbox = document.querySelector("#janela-lightbox");
const imgAmpliada = document.querySelector("#img-ampliada");

if (pista && janelaLightbox && imgAmpliada) {
  const imagensOriginais = Array.from(pista.children);

  imagensOriginais.forEach((img) => {
    const clone = img.cloneNode(true);
    pista.appendChild(clone);
  });

  const todasAsImagens = document.querySelectorAll(".img-portfolio");

  todasAsImagens.forEach((img) => {
    img.addEventListener("click", () => {
      imgAmpliada.src = img.src;
      janelaLightbox.classList.add("ativo");
    });
  });

  janelaLightbox.addEventListener("click", () => {
    janelaLightbox.classList.remove("ativo");

    setTimeout(() => {
      imgAmpliada.src = "";
    }, 400);
  });
}

// ===============================
// TEXT REVEAL — MISSÃO
// ===============================
const textoMissao = document.querySelector("#texto-missao");

if (textoMissao) {
  const palavras = textoMissao.innerText.split(" ");

  textoMissao.innerHTML = "";

  palavras.forEach((palavra) => {
    const span = document.createElement("span");
    span.className = "palavra-revelar";
    span.innerText = palavra + " ";
    textoMissao.appendChild(span);
  });

  gsap.to(".palavra-revelar", {
    opacity: 1,
    stagger: 0.1,
    scrollTrigger: {
      trigger: ".secao-missao",
      start: "top 60%",
      end: "bottom 70%",
      scrub: 1,
    },
  });
}

// ===============================
// ANIMAÇÕES — ESTÚDIO NOVO
// ===============================
const secaoEstudioNova = document.querySelector(".secao-estudio-nova");

if (secaoEstudioNova && window.innerWidth > 768) {
  // Título de abertura: aparece vindo de baixo
  gsap.from(".estudio-titulo-grande", {
    yPercent: 35,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out",
    scrollTrigger: {
      trigger: ".estudio-abertura",
      start: "top 70%",
    },
  });

  gsap.to(".estudio-abertura-bg", {
    scale: 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".estudio-abertura",
      start: "top bottom",
      end: "bottom top",
      scrub: 1.4,
    },
  });

  // Imagem 1 sobe e revela com máscara
  gsap.fromTo(
    ".estudio-img-1",
    {
      y: 220,
      opacity: 0,
      clipPath: "inset(100% 0% 0% 0%)",
    },
    {
      y: -80,
      opacity: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: {
        trigger: ".estudio-galeria-scroll",
        start: "top bottom",
        end: "center center",
        scrub: 1.3,
      },
    },
  );

  // Imagem 2 sobe em outro ritmo
  gsap.fromTo(
    ".estudio-img-2",
    {
      y: 300,
      opacity: 0,
      clipPath: "inset(100% 0% 0% 0%)",
    },
    {
      y: -120,
      opacity: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: {
        trigger: ".estudio-galeria-scroll",
        start: "top center",
        end: "bottom center",
        scrub: 1.5,
      },
    },
  );

  // Texto central aparece suave
  gsap.fromTo(
    ".estudio-texto-central p",
    {
      y: 80,
      opacity: 0,
      filter: "blur(4px)",
    },
    {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      ease: "none",
      scrollTrigger: {
        trigger: ".estudio-galeria-scroll",
        start: "top 85%",
        end: "35% center",
        scrub: 1.2,
      },
    },
  );

  // Texto central vai sumindo antes do próximo bloco
  gsap.to(".estudio-texto-central p", {
    y: -80,
    opacity: 0,
    filter: "blur(4px)",
    ease: "none",
    scrollTrigger: {
      trigger: ".estudio-galeria-scroll",
      start: "65% center",
      end: "bottom 40%",
      scrub: 1.2,
    },
  });

  // Bloco 50/50: imagem entra subindo com escala
  gsap.fromTo(
    ".estudio-coluna-imagem img",
    {
      scale: 1.18,
      yPercent: 12,
      clipPath: "inset(100% 0% 0% 0%)",
    },
    {
      scale: 1,
      yPercent: 0,
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: {
        trigger: ".estudio-duas-colunas",
        start: "top bottom",
        end: "top center",
        scrub: 1.3,
      },
    },
  );

  // Bloco 50/50: texto entra
  gsap.fromTo(
    ".estudio-coluna-texto div",
    {
      y: 90,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".estudio-duas-colunas",
        start: "top 60%",
      },
    },
  );
}

// ===============================
// FORMULÁRIO
// ===============================
const form = document.querySelector("#form-tatuagem");
const inputTelefone = document.querySelector("#telefone");
const inputImagem = document.querySelector("#imagem");
const nomeArquivoSpan = document.querySelector("#nome-arquivo");
const mensagemSucesso = document.querySelector("#mensagem-sucesso");

if (form) {
  if (inputTelefone) {
    inputTelefone.addEventListener("input", function (e) {
      let valor = e.target.value;

      valor = valor.replace(/\D/g, "");
      valor = valor.slice(0, 11);

      if (valor.length > 2) {
        valor = "(" + valor.substring(0, 2) + ") " + valor.substring(2);
      }

      if (valor.length > 10) {
        valor = valor.substring(0, 10) + "-" + valor.substring(10, 15);
      }

      e.target.value = valor;
    });
  }

  if (inputImagem && nomeArquivoSpan) {
    inputImagem.addEventListener("change", function (e) {
      if (e.target.files.length > 0) {
        nomeArquivoSpan.textContent = "✔️ Ficheiro: " + e.target.files[0].name;
        nomeArquivoSpan.style.color = "#fff";
      } else {
        nomeArquivoSpan.textContent = "+ Anexar Referência";
        nomeArquivoSpan.style.color = "#888";
      }
    });
  }

  const camposObrigatorios = form.querySelectorAll("[required]");

  camposObrigatorios.forEach((campo) => {
    campo.addEventListener("blur", () => {
      if (!campo.checkValidity()) {
        campo.classList.add("erro-validacao");
      } else {
        campo.classList.remove("erro-validacao");
      }
    });

    campo.addEventListener("input", () => {
      if (campo.classList.contains("erro-validacao") && campo.checkValidity()) {
        campo.classList.remove("erro-validacao");
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let temErro = false;
    const campos = form.querySelectorAll("[required]");

    campos.forEach((campo) => {
      if (!campo.checkValidity()) {
        campo.classList.add("erro-validacao");
        temErro = true;
      } else {
        campo.classList.remove("erro-validacao");
      }
    });

    if (!temErro && mensagemSucesso) {
      form.classList.add("escondido");
      mensagemSucesso.classList.remove("escondido");
    }
  });

  form.addEventListener("input", function (e) {
    if (e.target.classList.contains("erro-validacao")) {
      e.target.classList.remove("erro-validacao");
    }
  });
}

// ===============================
// MARCAÇÕES ANIMADAS NO SCROLL
// ===============================
const marcacoesScroll = document.querySelectorAll(".marcacao-scroll");

if (marcacoesScroll.length > 0) {
  const observerMarcacoes = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("ativo");
        }
      });
    },
    {
      threshold: 0.5,
    },
  );

  marcacoesScroll.forEach((marcacao) => {
    observerMarcacoes.observe(marcacao);
  });
}

// ===============================
// BOTÃO FLUTUANTE WHATSAPP
// ===============================
const botaoWhatsapp = document.querySelector("#botao-whatsapp");

if (botaoWhatsapp) {
  const numeroWhatsapp = "5511987902213";
  const mensagemWhatsapp = encodeURIComponent(
    "Olá, Dani! Vim pelo site e gostaria de fazer um orçamento.",
  );

  const linkDesktop = `https://wa.me/${numeroWhatsapp}?text=${mensagemWhatsapp}`;
  const linkMobile = `whatsapp://send?phone=${numeroWhatsapp}&text=${mensagemWhatsapp}`;

  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent,
    );

  botaoWhatsapp.setAttribute("href", isMobile ? linkMobile : linkDesktop);

  if (!isMobile) {
    botaoWhatsapp.setAttribute("target", "_blank");
    botaoWhatsapp.setAttribute("rel", "noopener noreferrer");
  }
}

// ===============================
// FOOTER REVEAL SIMPLES
// ===============================
const secaoOrcamento = document.querySelector(".secao-orcamento");
const secaoRodape = document.querySelector(".secao-rodape");

if (secaoOrcamento && secaoRodape) {
  const isMobileFooter = window.innerWidth <= 768;

  if (!isMobileFooter) {
    gsap.to(secaoOrcamento, {
      yPercent: -5,
      scale: 0.965,
      borderBottomLeftRadius: "70px",
      borderBottomRightRadius: "70px",
      ease: "none",
      scrollTrigger: {
        trigger: secaoOrcamento,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1.2,

        onEnter: () => {
          secaoRodape.classList.add("footer-reveal-visivel");
        },

        onEnterBack: () => {
          secaoRodape.classList.add("footer-reveal-visivel");
        },

        onLeaveBack: () => {
          secaoRodape.classList.remove("footer-reveal-visivel");
        },
      },
    });

    gsap.fromTo(
      ".conteudo-rodape",
      {
        y: 80,
        opacity: 0.6,
      },
      {
        y: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: secaoRodape,
          start: "top bottom",
          end: "top center",
          scrub: 1.2,
        },
      },
    );
  } else {
    secaoRodape.classList.add("footer-reveal-visivel");
  }
}

// ===============================
// ANO AUTOMÁTICO
// ===============================
const spanAno = document.getElementById("ano-atual");

if (spanAno) {
  spanAno.textContent = new Date().getFullYear();
}
