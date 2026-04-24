import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// 1. Nova importação: O "leitor" de ficheiros .glb
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

gsap.registerPlugin(ScrollTrigger);

// --- CONFIGURAÇÃO DO PALCO ---
const cena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderizador = new THREE.WebGLRenderer({
  canvas: document.querySelector("#cenario3d"),
  alpha: true,
  antialias: true, // <-- NOVO: Ativa a suavização das bordas (adeus "escadinhas")
});
renderizador.setPixelRatio(window.devicePixelRatio);
renderizador.setSize(window.innerWidth, window.innerHeight);

renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1;

// 2. ADICIONAR LUZES (Sem isto, o modelo fica escuro)
const luzAmbiente = new THREE.AmbientLight(0xffffff, 2); // Luz que ilumina tudo por igual
cena.add(luzAmbiente);

const luzDirecional = new THREE.DirectionalLight(0xffffff, 3); // Luz como a do sol
luzDirecional.position.set(5, 5, 5);
cena.add(luzDirecional);

const luzPreenchimento = new THREE.DirectionalLight(0xffffff, 3);
luzPreenchimento.position.set(-5, 0, -5); // Vem da esquerda e de trás
cena.add(luzPreenchimento);

// DICA EXTRA: Alguns modelos .glb precisam deste pequeno ajuste de cor
// para as cores ficarem mais vivas e reais no ecrã:
renderizador.outputColorSpace = THREE.SRGBColorSpace;

// 3. CRIAR UM GRUPO (A "caixa" invisível que vamos animar)
// Usamos um grupo para podermos animá-lo mesmo enquanto o ficheiro pesado está a carregar
const grupoModelo = new THREE.Group();
cena.add(grupoModelo);

// 4. CARREGAR O MODELO 3D
const carregador = new GLTFLoader();
// O Vite sabe que '/modelo.glb' significa ir procurar na pasta 'public'
carregador.load("/modelo.glb", function (gltf) {
  const modeloArte = gltf.scene;

  // Dependendo de quem fez o modelo, ele pode vir gigante ou minúsculo.
  // Podes alterar estes números para (0.5, 0.5, 0.5) para encolher, ou (2, 2, 2) para aumentar.
  modeloArte.scale.set(10, 10, 10);

  // Centrar o modelo no ecrã (opcional, mas recomendado)
  modeloArte.position.set(-15, 0, 0);

  // Adiciona o modelo carregado dentro do nosso grupo invisível
  grupoModelo.add(modeloArte);
});

camara.position.z = 5; // Afastei um pouco mais a câmara para modelos maiores

// --- ANIMAÇÃO COM GSAP ---
// Agora animamos o GRUPO, que contém o modelo
gsap.to(grupoModelo.rotation, {
  y: Math.PI * 2,
  x: Math.PI,
  scrollTrigger: {
    trigger: "main",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
  },
});

// --- LOOP DE RENDERIZAÇÃO ---
function animar() {
  requestAnimationFrame(animar);
  renderizador.render(cena, camara);
}
animar();

// --- RESPONSIVIDADE PARA TELEMÓVEIS E REDIMENSIONAMENTO ---

window.addEventListener("resize", () => {
  // 1. Atualiza a proporção da Câmara (os nossos "olhos")
  camara.aspect = window.innerWidth / window.innerHeight;
  // Sempre que mudamos a proporção da câmara, temos de chamar este comando:
  camara.updateProjectionMatrix();

  // 2. Atualiza o tamanho do Renderizador (o nosso "palco")
  renderizador.setSize(window.innerWidth, window.innerHeight);

  // 3. Garante que a qualidade não se perde ao rodar o telemóvel
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- CABEÇALHO INTELIGENTE (Smart Header) ---

// 1. Selecionamos o cabeçalho no HTML
const cabecalho = document.querySelector("#meu-cabecalho");

// 2. Criamos uma variável para memorizar a última posição do scroll
let ultimoScroll = 0;

// 3. Adicionamos um "ouvinte" que deteta sempre que o utilizador rola a página
window.addEventListener("scroll", () => {
  // Descobre a posição atual (quantos pixeis descemos do topo)
  const scrollAtual = window.scrollY;

  // Proteção: Se estivermos no topo absoluto, garante que o menu aparece
  // (útil para os telemóveis que têm aquele efeito de "mola" no topo)
  if (scrollAtual <= 0) {
    cabecalho.classList.remove("escondido");
    return; // Pára de ler o resto da função aqui
  }

  // A LÓGICA PRINCIPAL:
  if (scrollAtual > ultimoScroll) {
    // Se a posição de agora é MAIOR que a anterior, significa que estamos a descer.
    // Adicionamos a classe que criámos no CSS para o empurrar para cima.
    cabecalho.classList.add("escondido");
  } else {
    // Se a posição de agora é MENOR, significa que estamos a subir.
    // Removemos a classe para ele voltar a descer.
    cabecalho.classList.remove("escondido");
  }

  // No fim, atualizamos a memória com a posição atual para a próxima comparação
  ultimoScroll = scrollAtual;
});

// --- MENU HAMBURGER (Mobile) ---
const btnMenu = document.querySelector("#btn-menu");
const menuNavegacao = document.querySelector("#menu-navegacao");
// Seleciona todos os links dentro da navegação
const linksMenu = document.querySelectorAll(".navegacao a");

if (btnMenu && menuNavegacao) {
  // 1. O que acontece ao clicar no botão Hamburger?
  btnMenu.addEventListener("click", () => {
    // A função toggle adiciona a classe se ela não existir, e remove se ela existir!
    menuNavegacao.classList.toggle("ativa");
    btnMenu.classList.toggle("ativo");
  });

  // 2. O que acontece ao clicar num dos links do menu?
  // Precisamos fechar o menu automaticamente para o utilizador ver a secção!
  linksMenu.forEach((link) => {
    link.addEventListener("click", () => {
      menuNavegacao.classList.remove("ativa");
      btnMenu.classList.remove("ativo");
    });
  });
}

// --- ANIMAÇÕES DE SCROLL (Secção Sobre Mim) ---

const elementosAnimar = document.querySelectorAll(".animar-scroll");

if (elementosAnimar.length > 0) {
  elementosAnimar.forEach((elemento) => {
    // Usamos o fromTo: De {estadoA} Para {estadoB}
    gsap.fromTo(
      elemento,
      {
        // 1. ESTADO INICIAL (De onde começa)
        opacity: 0,
        y: 100, // Começa 100px para baixo
      },
      {
        // 2. ESTADO FINAL (Para onde vai)
        opacity: 1,
        y: 0, // Volta à posição original (0)
        duration: 2.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: elemento,
          start: "top 85%", // A animação dispara quando o topo do elemento chega perto do fundo do ecrã
          // markers: true // Descomenta esta linha se a animação continuar sem aparecer
        },
      },
    );
  });
}

// --- STICKY SCROLL (Secção Diferenciais) ---
const blocosTexto = document.querySelectorAll(".bloco-dif");
const imagensFundo = document.querySelectorAll(".img-diferencial");

if (blocosTexto.length > 0) {
  blocosTexto.forEach((bloco, index) => {
    ScrollTrigger.create({
      trigger: bloco,
      start: "top center", // Dispara quando o topo do texto atinge o meio do ecrã
      end: "bottom center", // Termina quando o fundo do texto sai do meio do ecrã

      // onToggle executa sempre que o elemento entra ou sai da área ativa
      onToggle: (self) => {
        if (self.isActive) {
          // 1. Remove a classe 'ativa' de TODAS as imagens
          imagensFundo.forEach((img) => img.classList.remove("ativa"));

          // 2. Adiciona a classe 'ativa' apenas à imagem correspondente ao texto atual
          imagensFundo[index].classList.add("ativa");
        }
      },
    });
  });
}

// --- CARROSSEL INFINITO E LIGHTBOX (Portfólio) ---
const pista = document.querySelector("#pista-portfolio");
const janelaLightbox = document.querySelector("#janela-lightbox");
const imgAmpliada = document.querySelector("#img-ampliada");

if (pista) {
  // 1. Clonar as imagens para criar o efeito infinito sem esforço manual
  const imagensOriginais = Array.from(pista.children);

  imagensOriginais.forEach((img) => {
    const clone = img.cloneNode(true); // Faz uma cópia exata da imagem
    pista.appendChild(clone); // Cola-a no fim da fila
  });

  // 2. Configurar o Lightbox (Abrir a imagem)
  // Precisamos selecionar as imagens novamente para incluir os clones!
  const todasAsImagens = document.querySelectorAll(".img-portfolio");

  todasAsImagens.forEach((img) => {
    img.addEventListener("click", () => {
      imgAmpliada.src = img.src; // Copia a fonte da foto clicada para o ecrã inteiro
      janelaLightbox.classList.add("ativo"); // Mostra a janela
    });
  });

  // 3. Configurar o Lightbox (Fechar)
  // Fecha se clicar na janela escura ou no botão de fechar
  janelaLightbox.addEventListener("click", () => {
    janelaLightbox.classList.remove("ativo");
    // Espera a animação acabar para limpar a imagem
    setTimeout(() => (imgAmpliada.src = ""), 400);
  });
}

// --- TEXT REVEAL ON SCROLL (Secção Missão) ---
const textoMissao = document.querySelector("#texto-missao");

if (textoMissao) {
  // 1. O JavaScript pega no texto inteiro e corta-o palavra por palavra
  const palavras = textoMissao.innerText.split(" ");

  // 2. Limpamos a caixa original
  textoMissao.innerHTML = "";

  // 3. Colocamos as palavras de volta, mas agora cada uma tem o seu próprio <span>
  palavras.forEach((palavra) => {
    const span = document.createElement("span");
    span.className = "palavra-revelar";
    span.innerText = palavra + " "; // Adiciona um espaço no fim para não colar
    textoMissao.appendChild(span);
  });

  // 4. Dizemos ao GSAP para "acender" essas palavras
  gsap.to(".palavra-revelar", {
    opacity: 1, // Passa para 100% visível
    stagger: 0.1, // Acende uma a uma (em cascata)
    scrollTrigger: {
      trigger: ".secao-missao",
      start: "top 60%", // Começa quando a secção entra no ecrã
      end: "bottom 70%", // Acaba de revelar antes de saíres da secção
      scrub: 1, // A MÁGICA: Liga a animação ao teu scroll! (Com 1 segundo de fluidez)
    },
  });
}

// --- SLIDESHOW AUTOMÁTICO (Secção Estúdio) ---
const slidesEstudio = document.querySelectorAll(".foto-slide");
let slideAtual = 0; // Começamos no primeiro slide (índice 0)

if (slidesEstudio.length > 0) {
  // A função setInterval é como um relógio que roda código a cada X tempo
  setInterval(() => {
    // 1. Remove a classe 'ativa' da foto que está visível agora
    slidesEstudio[slideAtual].classList.remove("ativa");

    // 2. Calcula qual é a próxima foto.
    // A matemática (slideAtual + 1) % quantidade garante que, quando chegar à última, volta à primeira!
    slideAtual = (slideAtual + 1) % slidesEstudio.length;

    // 3. Adiciona a classe 'ativa' à nova foto
    slidesEstudio[slideAtual].classList.add("ativa");
  }, 4000); // 4000 milissegundos = Muda de foto a cada 4 segundos
}

// --- LÓGICA DO FORMULÁRIO DE CONTACTO ---
const form = document.querySelector("#form-tatuagem");
const inputTelefone = document.querySelector("#telefone");
const inputImagem = document.querySelector("#imagem");
const nomeArquivoSpan = document.querySelector("#nome-arquivo");
const mensagemSucesso = document.querySelector("#mensagem-sucesso");

if (form) {
  // 1. MÁSCARA DE TELEFONE (Formato Brasil: (XX) XXXXX-XXXX)
  inputTelefone.addEventListener("input", function (e) {
    let valor = e.target.value;

    // Remove tudo o que não for número
    valor = valor.replace(/\D/g, "");

    // Adiciona os parênteses e o traço progressivamente
    if (valor.length > 2) {
      valor = "(" + valor.substring(0, 2) + ") " + valor.substring(2);
    }
    if (valor.length > 10) {
      valor = valor.substring(0, 10) + "-" + valor.substring(10, 14);
    }

    e.target.value = valor; // Atualiza o campo com a máscara
  });

  // 2. ATUALIZAR O NOME DO FICHEIRO
  inputImagem.addEventListener("change", function (e) {
    if (e.target.files.length > 0) {
      // Se escolheu ficheiro, mostra o nome dele
      nomeArquivoSpan.textContent = "✔️ Ficheiro: " + e.target.files[0].name;
      nomeArquivoSpan.style.color = "#fff";
    } else {
      // Se cancelou, volta ao texto original
      nomeArquivoSpan.textContent = "+ Anexar Imagem de Referência (Opcional)";
      nomeArquivoSpan.style.color = "#888";
    }
  });

  const camposObrigatorios = form.querySelectorAll("[required]");

  camposObrigatorios.forEach((campo) => {
    // O evento 'blur' dispara assim que o utilizador clica fora do campo
    campo.addEventListener("blur", () => {
      // Verifica se a regra do HTML (required, type="email", etc.) não foi cumprida
      if (!campo.checkValidity()) {
        campo.classList.add("erro-validacao");
      } else {
        campo.classList.remove("erro-validacao");
      }
    });

    // O evento 'input' dispara assim que o utilizador começa a teclar (para limpar o erro imediatamente)
    campo.addEventListener("input", () => {
      if (campo.classList.contains("erro-validacao") && campo.checkValidity()) {
        campo.classList.remove("erro-validacao");
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // Impede o navegador de recarregar a página!

    // Vamos verificar se algum campo obrigatório está vazio
    let temErro = false;
    const campos = form.querySelectorAll("[required]");

    campos.forEach((campo) => {
      if (!campo.checkValidity()) {
        campo.classList.add("erro-validacao"); // Pinta a linha de vermelho
        temErro = true;
      } else {
        campo.classList.remove("erro-validacao");
      }
    });

    // Se estiver tudo preenchido corretamente, mostramos a mensagem de sucesso!
    if (!temErro) {
      form.classList.add("escondido"); // Esconde o formulário
      mensagemSucesso.classList.remove("escondido"); // Mostra a mensagem de sucesso

      // Aqui, num projeto real, colocarias o código para enviar os dados para o teu email (ex: usando Formspree ou EmailJS)
    }
  });

  // Limpa o erro de vermelho assim que o utilizador começa a digitar de novo
  form.addEventListener("input", function (e) {
    if (e.target.classList.contains("erro-validacao")) {
      e.target.classList.remove("erro-validacao");
    }
  });
}

// --- CURSOR RASTRO DE TINTA (Canvas) ---
const canvasTinta = document.getElementById("cursor-tinta");

// Só executamos se não for telemóvel
if (canvasTinta && window.matchMedia("(pointer: fine)").matches) {
  const ctx = canvasTinta.getContext("2d");

  // 1. Ajustar o tamanho da tela para ocupar o ecrã todo
  function redimensionar() {
    canvasTinta.width = window.innerWidth;
    canvasTinta.height = window.innerHeight;
  }
  window.addEventListener("resize", redimensionar);
  redimensionar();

  // 2. Configurações do Rastro
  let rato = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let pontos = [];
  const quantidadePontos = 35; // Quantos pontos formam a cauda (mais pontos = cauda mais longa)

  // Criamos os pontos iniciais (todos no meio do ecrã)
  for (let i = 0; i < quantidadePontos; i++) {
    pontos.push({ x: rato.x, y: rato.y });
  }

  // 3. Ouve o movimento do rato
  window.addEventListener("mousemove", (e) => {
    rato.x = e.clientX;
    rato.y = e.clientY;
  });

  // 4. O Ciclo de Desenho (Animação a 60fps)
  function animarTinta() {
    // Limpa a tela no início de cada frame
    ctx.clearRect(0, 0, canvasTinta.width, canvasTinta.height);

    // O primeiro ponto segue exatamente o rato
    pontos[0].x = rato.x;
    pontos[0].y = rato.y;

    // Os outros pontos seguem o ponto da frente com um atraso elástico
    for (let i = 1; i < quantidadePontos; i++) {
      // O número 0.4 controla a "velocidade" de reação da cauda.
      pontos[i].x += (pontos[i - 1].x - pontos[i].x) * 0.4;
      pontos[i].y += (pontos[i - 1].y - pontos[i].y) * 0.4;
    }

    // Desenhar a "Tinta"
    for (let i = 0; i < quantidadePontos; i++) {
      // Começa mais grosso (6px) e vai afinando até 0 na ponta da cauda
      const espessura = Math.max(0, 6 - i * (6 / quantidadePontos));

      // A transparência começa em 100% e vai sumindo
      const opacidade = 1 - i / quantidadePontos;

      ctx.beginPath();
      ctx.arc(pontos[i].x, pontos[i].y, espessura, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacidade})`; // Cor Branca com transparência
      ctx.fill();
    }

    requestAnimationFrame(animarTinta);
  }

  animarTinta();
}
