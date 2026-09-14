/* ════════════════════════════════════════════════════════════════════════
   REVIEW TOOL — Sistema de Revisão Visual
   ════════════════════════════════════════════════════════════════════════

   O QUE É
   -------
   Uma camada de comentários visuais para qualquer site: o cliente ativa
   um "Modo de revisão", clica em qualquer elemento da página e deixa um
   comentário ali mesmo. No final, ele baixa um arquivo .json e te envia.

   100% HTML + CSS + JavaScript puro. Sem React, sem jQuery, sem CDN,
   sem servidor, sem banco de dados. Os comentários ficam guardados no
   localStorage do navegador enquanto o cliente revisa, e viajam pra
   você dentro do arquivo .json que ele baixa e te manda.


   COMO USAR EM QUALQUER OUTRO SITE (3 passos)
   ---------------------------------------------
   1) Copie este arquivo (review-tool.js) para dentro da pasta do
      projeto — não precisa editar nada dentro dele.

   2) No HTML do site, cole esta linha UMA ÚNICA VEZ, bem no fim do
      arquivo, logo antes de </body>:

          <script src="review-tool.js"></script>

      Se o arquivo estiver dentro de uma subpasta, ajuste o caminho:

          <script src="js/review-tool.js"></script>

   3) Pronto. Abra o site no navegador — vai aparecer uma barrinha
      "Revisar" flutuando no rodapé da tela. Não precisa mexer em
      mais nada: o próprio script cria seu CSS, seus botões e todo
      o resto sozinho.


   PERSONALIZAR O NOME DO SITE (opcional)
   ---------------------------------------
   O nome que aparece dentro do arquivo .json exportado (campo "site")
   ajuda você a saber de qual projeto veio aquela revisão quando tiver
   vários clientes usando a ferramenta ao mesmo tempo.

   Por padrão, o script usa o <title> da própria página. Se quiser um
   nome diferente, não precisa editar este arquivo — só acrescente um
   atributo na tag <script> que você colou no passo 2:

          <script src="review-tool.js" data-site-name="Site da Ana"></script>


   COMO REMOVER
   ------------
   Basta apagar a linha <script src="review-tool.js"></script> do HTML.
   Nada mais no site precisa ser desfeito — a ferramenta não altera
   nenhum elemento existente da página, só adiciona os seus próprios
   por cima.


   O QUE O CLIENTE FAZ DEPOIS DE COMENTAR
   ----------------------------------------
   Dentro do painel de comentários (ícone de balão na barrinha) tem um
   botão bem chamativo "Baixar revisão". Isso gera um arquivo:

          revisao-site-AAAA-MM-DD.json

   O cliente te envia esse arquivo (por e-mail, WhatsApp, etc.). Você
   não precisa de nenhum sistema pra "receber" isso — é só um arquivo
   comum que alguém te manda, igual uma foto ou um PDF.

   Se quiser reabrir esse JSON depois pra ver os comentários de novo
   (por exemplo, numa versão futura da página), use o botão de
   importar (ícone de seta pra cima) dentro do mesmo painel.


   DETALHES TÉCNICOS ÚTEIS SE VOCÊ FOR MEXER NO CÓDIGO
   ------------------------------------------------------
   • Os comentários são guardados no localStorage com a chave
     "site-review-comments". O localStorage é isolado por domínio —
     ou seja, se você usar esta ferramenta em dois projetos DIFERENTES
     hospedados no MESMO domínio (ex: dois subdiretórios do mesmo
     site), os comentários de um poderiam se misturar com os do outro.
     Nesse caso específico, troque o valor de STORE_KEY logo abaixo
     para algo único por projeto (ex: "site-review-comments-projetoX").

   • A referência de cada comentário é o próprio elemento do HTML
     (por id, atributo data-review-id, ou caminho na árvore do DOM) —
     nunca a posição x/y da tela. Por isso os comentários continuam
     certos mesmo se o texto ao redor mudar de lugar.

   • O trecho que espera o elemento #preloader "sumir" antes de
     mostrar a barrinha é uma cortesia pensada pro site da HS, que
     tem uma tela de carregamento com esse id. Em qualquer outro site
     que não tenha um #preloader, essa parte simplesmente não faz
     nada e a barrinha aparece assim que a página carrega — não
     precisa mexer em nada.

   ════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════ constantes ═══════════════ */
  var STORE_KEY = 'site-review-comments';
  var SETTINGS_KEY = 'site-review-settings';
  var FORMAT_VERSION = 1;
  /* nome do site que aparece no JSON exportado — veja "PERSONALIZAR
     O NOME DO SITE" no comentário no topo deste arquivo */
  var SITE_NAME = (document.currentScript && document.currentScript.getAttribute('data-site-name'))
    || document.title || 'Site sem nome';
  var ATTR = 'data-review-id';

  /* elementos que valem um comentário por si só */
  var MEANINGFUL = 'a,button,input,textarea,select,label,img,video,picture,svg,h1,h2,h3,h4,h5,h6,p,li,dt,dd,figure,figcaption,blockquote,section,article,header,footer,nav,aside,form,fieldset,table,details,summary';
  /* wrappers que nunca devem virar alvo sozinhos */
  var TRIVIAL = { SPAN: 1, STRONG: 1, EM: 1, B: 1, I: 1, U: 1, SMALL: 1, BR: 1, PATH: 1, SVG: 1, G: 1, CIRCLE: 1, RECT: 1, LINE: 1, POLYLINE: 1, POLYGON: 1, USE: 1, DEFS: 1, CODE: 1, TIME: 1 };

  var ICONS = {
    pencil: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/></svg>',
    panel: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 3v13M6 11l6 6 6-6M4 21h16"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 21V8M6 13l6-6 6 6M4 3h16"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    empty: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/></svg>'
  };

  /* ═══════════════ CSS injetado (nenhum arquivo .css separado é necessário) ═══════════════ */
  var STYLE = "\n"
    + "/* tokens no :root — as camadas de pins e o balão vivem fora de #review-tool-root\n"
    + "   (precisam das coordenadas do documento) e também precisam herdá-los */\n"
    + ":root{\n"
    + "  --rt-accent:#4F7CFF; --rt-accent-dk:#3A61D6; --rt-accent-soft:rgba(79,124,255,.16);\n"
    + "  --rt-surface:#151C29; --rt-surface-2:#1D2637; --rt-surface-3:#263148;\n"
    + "  --rt-line:rgba(255,255,255,.11); --rt-line-2:rgba(255,255,255,.18);\n"
    + "  --rt-text:#EEF2F9; --rt-muted:#94A3BC; --rt-amber:#F5B764; --rt-danger:#FF6B61;\n"
    + "  --rt-r:14px; --rt-r-sm:10px;\n"
    + "  --rt-shadow:0 18px 44px -14px rgba(2,8,20,.6),0 2px 8px -2px rgba(2,8,20,.4);\n"
    + "  --rt-ease:cubic-bezier(.22,1,.36,1);\n"
    + "}\n"
    + "#review-tool-root,.review-tool-layer,.review-tool-bubble{\n"
    + "  font-family:ui-sans-serif,system-ui,-apple-system,\"Segoe UI\",Roboto,\"Helvetica Neue\",sans-serif;\n"
    + "  font-size:14px; line-height:1.5; -webkit-font-smoothing:antialiased;\n"
    + "}\n"
    + "#review-tool-root{\n"
    + "  position:fixed; inset:0; z-index:100000; pointer-events:none; color:var(--rt-text);\n"
    + "}\n"
    + "/* :where() zera a especificidade do reset para não vencer os estilos dos componentes */\n"
    + ":where(#review-tool-root,.review-tool-layer,.review-tool-bubble) *{box-sizing:border-box}\n"
    + ":where(#review-tool-root,.review-tool-layer,.review-tool-bubble) button{font:inherit;cursor:pointer;border:0;background:none;color:inherit}\n"
    + ":where(#review-tool-root,.review-tool-layer,.review-tool-bubble) :focus-visible{outline:2px solid var(--rt-accent);outline-offset:2px;border-radius:6px}\n"
    + ".review-tool-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\n"
    + "\n"
    + "/* ---------- camadas de marcação (coordenadas do documento) ---------- */\n"
    + ".review-tool-layer{position:absolute;top:0;left:0;width:0;height:0;z-index:99980;pointer-events:none}\n"
    + ".review-tool-layer--fixed{position:fixed;z-index:2}\n"
    + "\n"
    + "/* ---------- destaque de hover ---------- */\n"
    + ".review-tool-highlight{\n"
    + "  position:fixed;top:0;left:0;z-index:1;pointer-events:none;\n"
    + "  border:2px solid var(--rt-accent); border-radius:8px;\n"
    + "  background:var(--rt-accent-soft); box-shadow:0 0 0 1px rgba(255,255,255,.35) inset;\n"
    + "  opacity:0; transform:translate3d(0,0,0);\n"
    + "  transition:opacity .16s linear, transform .16s var(--rt-ease), width .16s var(--rt-ease), height .16s var(--rt-ease);\n"
    + "}\n"
    + ".review-tool-highlight.is-on{opacity:1}\n"
    + ".review-tool-highlight--focus{border-color:var(--rt-amber);background:rgba(245,183,100,.18);transition:opacity .3s linear}\n"
    + ".review-tool-highlight__tag{\n"
    + "  position:absolute; left:-2px; top:-26px; height:22px; display:inline-flex; align-items:center; gap:6px;\n"
    + "  padding:0 9px; border-radius:6px; background:var(--rt-accent); color:#fff;\n"
    + "  font-size:11px; font-weight:650; letter-spacing:.02em; white-space:nowrap;\n"
    + "  box-shadow:0 4px 12px -4px rgba(79,124,255,.8);\n"
    + "}\n"
    + ".review-tool-highlight__tag::after{content:\"\";position:absolute;left:10px;top:100%;border:4px solid transparent;border-top-color:var(--rt-accent)}\n"
    + ".review-tool-highlight--below .review-tool-highlight__tag{top:auto;bottom:-26px}\n"
    + ".review-tool-highlight--below .review-tool-highlight__tag::after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:var(--rt-accent)}\n"
    + "\n"
    + "/* ---------- pins ---------- */\n"
    + ".review-tool-pin{\n"
    + "  position:absolute; left:0; top:0; width:28px; height:28px; margin:-14px 0 0 -14px; padding:0;\n"
    + "  border-radius:50%; pointer-events:auto;\n"
    + "  background:linear-gradient(160deg,#6A90FF,var(--rt-accent-dk));\n"
    + "  color:#fff; font-size:12.5px; font-weight:700; line-height:1;\n"
    + "  display:grid; place-items:center;\n"
    + "  box-shadow:0 3px 10px -2px rgba(20,40,100,.6),0 0 0 2px #fff;\n"
    + "  transition:transform .22s var(--rt-ease),box-shadow .22s var(--rt-ease);\n"
    + "  animation:review-tool-pop .34s var(--rt-ease) both;\n"
    + "}\n"
    + "@keyframes review-tool-pop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}\n"
    + ".review-tool-pin:hover{transform:scale(1.14)}\n"
    + ".review-tool-pin.is-open{transform:scale(1.14);box-shadow:0 3px 10px -2px rgba(20,40,100,.6),0 0 0 2px #fff,0 0 0 6px var(--rt-accent-soft)}\n"
    + ".review-tool-pin.is-orphan{background:linear-gradient(160deg,#8F9AAF,#5C6780)}\n"
    + ".review-tool-pin--ghost{position:fixed;left:-999px;top:-999px}\n"
    + "\n"
    + "/* ---------- balão ---------- */\n"
    + ".review-tool-bubble{\n"
    + "  position:fixed; left:0; top:0; z-index:50; width:320px; max-width:calc(100vw - 24px); pointer-events:auto;\n"
    + "  background:#fff; color:#121A28; border-radius:var(--rt-r);\n"
    + "  box-shadow:0 24px 60px -18px rgba(4,12,28,.45),0 3px 10px -3px rgba(4,12,28,.28);\n"
    + "  animation:review-tool-bubble-in .24s var(--rt-ease) both;\n"
    + "}\n"
    + "@keyframes review-tool-bubble-in{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}\n"
    + ".review-tool-bubble__head{display:flex;align-items:center;gap:8px;padding:13px 14px 0}\n"
    + ".review-tool-bubble__num{\n"
    + "  flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;\n"
    + "  background:var(--rt-accent);color:#fff;font-size:11px;font-weight:700\n"
    + "}\n"
    + ".review-tool-bubble__title{font-size:13px;font-weight:700;letter-spacing:-.01em}\n"
    + ".review-tool-bubble__close{margin-left:auto;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:#7A8698}\n"
    + ".review-tool-bubble__close:hover{background:#EFF2F7;color:#121A28}\n"
    + ".review-tool-bubble__chip{\n"
    + "  margin:9px 14px 0;padding:6px 9px;border-radius:8px;background:#F1F4F9;\n"
    + "  font-size:11.5px;color:#5A6678;display:flex;gap:6px;align-items:baseline;\n"
    + "}\n"
    + ".review-tool-bubble__chip code{font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--rt-accent-dk);flex:none}\n"
    + ".review-tool-bubble__chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n"
    + ".review-tool-bubble__body{padding:11px 14px 0;font-size:13.5px;color:#25303F;white-space:pre-wrap;word-break:break-word;max-height:220px;overflow:auto}\n"
    + ".review-tool-bubble__meta{padding:8px 14px 0;font-size:11px;color:#8A94A6}\n"
    + ".review-tool-bubble textarea{\n"
    + "  display:block;width:calc(100% - 28px);margin:11px 14px 0;padding:10px 11px;\n"
    + "  border:1.5px solid #DDE3EC;border-radius:var(--rt-r-sm);resize:vertical;min-height:86px;\n"
    + "  font:inherit;font-size:13.5px;color:#121A28;background:#fff;\n"
    + "  transition:border-color .18s,box-shadow .18s;\n"
    + "}\n"
    + ".review-tool-bubble textarea:focus{outline:0;border-color:var(--rt-accent);box-shadow:0 0 0 3px var(--rt-accent-soft)}\n"
    + ".review-tool-bubble textarea::placeholder{color:#9AA5B5}\n"
    + ".review-tool-bubble__warn{margin:7px 14px 0;font-size:11.5px;font-weight:600;color:#D4342A}\n"
    + ".review-tool-bubble__foot{display:flex;gap:8px;justify-content:flex-end;padding:11px 14px 13px}\n"
    + ".review-tool-bubble__hint{margin-right:auto;align-self:center;font-size:10.5px;color:#9AA5B5}\n"
    + "\n"
    + "/* ---------- botões ---------- */\n"
    + ".review-tool-btn{\n"
    + "  display:inline-flex;align-items:center;justify-content:center;gap:7px;\n"
    + "  height:34px;padding:0 14px;border-radius:9px;font-size:13px;font-weight:650;\n"
    + "  transition:background .18s,color .18s,transform .18s var(--rt-ease),box-shadow .18s;\n"
    + "}\n"
    + ".review-tool-btn:active{transform:translateY(1px)}\n"
    + ".review-tool-btn svg{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n"
    + ".review-tool-btn--primary{background:var(--rt-accent);color:#fff;box-shadow:0 6px 16px -6px rgba(79,124,255,.9)}\n"
    + ".review-tool-btn--primary:hover{background:var(--rt-accent-dk)}\n"
    + ".review-tool-btn--quiet{background:#EFF2F7;color:#3A4658}\n"
    + ".review-tool-btn--quiet:hover{background:#E3E8F0}\n"
    + ".review-tool-btn--danger{background:#FEECEA;color:#C82F24}\n"
    + ".review-tool-btn--danger:hover{background:#FBDAD6}\n"
    + ".review-tool-btn--block{width:100%}\n"
    + "\n"
    + "/* ---------- toolbar ---------- */\n"
    + ".review-tool-toolbar{\n"
    + "  position:fixed; z-index:30; left:50%; bottom:max(18px,env(safe-area-inset-bottom));\n"
    + "  transform:translateX(-50%) translateY(120%); pointer-events:auto;\n"
    + "  display:flex; align-items:center; gap:4px; padding:5px;\n"
    + "  border-radius:100px; background:rgba(21,28,41,.92); border:1px solid var(--rt-line);\n"
    + "  box-shadow:var(--rt-shadow); backdrop-filter:blur(16px) saturate(160%); -webkit-backdrop-filter:blur(16px) saturate(160%);\n"
    + "  transition:transform .5s var(--rt-ease);\n"
    + "}\n"
    + ".review-tool-toolbar.is-ready{transform:translateX(-50%)}\n"
    + ".review-tool-toolbar__brand{display:flex;align-items:center;gap:7px;padding:0 10px 0 11px;font-size:12px;font-weight:700;color:var(--rt-muted);letter-spacing:.02em}\n"
    + ".review-tool-toolbar__dot{width:7px;height:7px;border-radius:50%;background:#5C6780;transition:background .3s,box-shadow .3s}\n"
    + ".review-tool-toolbar__sep{width:1px;height:20px;background:var(--rt-line)}\n"
    + ".review-tool-tbtn{\n"
    + "  display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border-radius:100px;\n"
    + "  font-size:13px;font-weight:650;color:var(--rt-text);transition:background .2s,color .2s,transform .2s var(--rt-ease);\n"
    + "}\n"
    + ".review-tool-tbtn:hover{background:rgba(255,255,255,.09)}\n"
    + ".review-tool-tbtn svg{width:15px;height:15px;flex:none;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}\n"
    + ".review-tool-tbtn--toggle.is-on{background:var(--rt-accent);color:#fff;box-shadow:0 6px 18px -6px rgba(79,124,255,.9)}\n"
    + ".review-tool-tbtn--toggle.is-on:hover{background:var(--rt-accent-dk)}\n"
    + ".review-tool-toolbar.is-active .review-tool-toolbar__dot{background:var(--rt-accent);box-shadow:0 0 0 4px var(--rt-accent-soft);animation:review-tool-pulse 2s ease-in-out infinite}\n"
    + "@keyframes review-tool-pulse{0%,100%{box-shadow:0 0 0 3px var(--rt-accent-soft)}50%{box-shadow:0 0 0 7px transparent}}\n"
    + ".review-tool-count{\n"
    + "  min-width:22px;height:22px;padding:0 7px;border-radius:100px;display:inline-grid;place-items:center;\n"
    + "  background:rgba(255,255,255,.12);font-size:11.5px;font-weight:700\n"
    + "}\n"
    + ".review-tool-tbtn--panel.is-on{background:rgba(255,255,255,.12)}\n"
    + "\n"
    + "/* ---------- painel ---------- */\n"
    + ".review-tool-panel{\n"
    + "  position:fixed;z-index:40;top:0;right:0;bottom:0;width:380px;max-width:100vw;pointer-events:auto;\n"
    + "  display:flex;flex-direction:column;background:var(--rt-surface);border-left:1px solid var(--rt-line);\n"
    + "  box-shadow:-24px 0 60px -24px rgba(2,8,20,.6);\n"
    + "  transform:translateX(102%);transition:transform .42s var(--rt-ease);\n"
    + "}\n"
    + ".review-tool-panel.is-open{transform:none}\n"
    + ".review-tool-panel__head{display:flex;align-items:center;gap:10px;padding:16px 16px 12px;border-bottom:1px solid var(--rt-line)}\n"
    + ".review-tool-panel__title{font-size:14px;font-weight:700;letter-spacing:-.01em}\n"
    + ".review-tool-panel__title small{display:block;font-size:11.5px;font-weight:500;color:var(--rt-muted);letter-spacing:0}\n"
    + ".review-tool-panel__tools{margin-left:auto;display:flex;gap:2px}\n"
    + ".review-tool-iconbtn{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:var(--rt-muted);transition:background .18s,color .18s}\n"
    + ".review-tool-iconbtn:hover{background:rgba(255,255,255,.09);color:var(--rt-text)}\n"
    + ".review-tool-iconbtn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}\n"
    + ".review-tool-panel__list{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:10px}\n"
    + ".review-tool-item{\n"
    + "  width:100%;text-align:left;display:flex;gap:11px;padding:11px;border-radius:var(--rt-r-sm);\n"
    + "  background:transparent;transition:background .18s;\n"
    + "}\n"
    + ".review-tool-item+.review-tool-item{margin-top:2px}\n"
    + ".review-tool-item:hover{background:rgba(255,255,255,.06)}\n"
    + ".review-tool-item.is-active{background:var(--rt-accent-soft);box-shadow:inset 0 0 0 1px rgba(79,124,255,.4)}\n"
    + ".review-tool-item__num{\n"
    + "  flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;margin-top:1px;\n"
    + "  background:var(--rt-accent);color:#fff;font-size:11px;font-weight:700\n"
    + "}\n"
    + ".review-tool-item.is-orphan .review-tool-item__num{background:#5C6780}\n"
    + ".review-tool-item__body{min-width:0;flex:1}\n"
    + ".review-tool-item__text{font-size:13px;color:var(--rt-text);word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n"
    + ".review-tool-item__ref{margin-top:4px;font-size:11px;color:var(--rt-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n"
    + ".review-tool-item__ref code{font:600 10.5px ui-monospace,SFMono-Regular,Menlo,monospace;color:#8FA9E8}\n"
    + ".review-tool-item__warn{margin-top:5px;font-size:11px;font-weight:650;color:var(--rt-amber);display:flex;gap:5px;align-items:center}\n"
    + ".review-tool-empty{padding:34px 22px;text-align:center;color:var(--rt-muted)}\n"
    + ".review-tool-empty svg{width:38px;height:38px;margin:0 auto 12px;display:block;fill:none;stroke:currentColor;stroke-width:1.4;opacity:.5}\n"
    + ".review-tool-empty strong{display:block;margin-bottom:6px;font-size:13.5px;color:var(--rt-text)}\n"
    + ".review-tool-empty p{margin:0;font-size:12.5px;line-height:1.6}\n"
    + ".review-tool-empty kbd{\n"
    + "  display:inline-block;padding:1px 6px;border-radius:5px;border:1px solid var(--rt-line-2);\n"
    + "  background:rgba(255,255,255,.07);font:600 11px ui-monospace,Menlo,monospace;color:var(--rt-text)\n"
    + "}\n"
    + "\n"
    + "/* ---------- bloco de entrega (aviso principal) ---------- */\n"
    + ".review-tool-deliver{\n"
    + "  margin:0;padding:14px;border-top:1px solid var(--rt-line);\n"
    + "  background:linear-gradient(170deg,rgba(245,183,100,.14),rgba(245,183,100,.05));\n"
    + "}\n"
    + ".review-tool-deliver__head{display:flex;gap:9px;align-items:flex-start;margin-bottom:9px}\n"
    + ".review-tool-deliver__icon{\n"
    + "  flex:none;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;\n"
    + "  background:rgba(245,183,100,.2);color:var(--rt-amber)\n"
    + "}\n"
    + ".review-tool-deliver__icon svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}\n"
    + ".review-tool-deliver__title{font-size:12.5px;font-weight:750;color:var(--rt-amber);letter-spacing:.01em}\n"
    + ".review-tool-deliver__title small{display:block;margin-top:2px;font-size:11.5px;font-weight:500;color:var(--rt-muted);letter-spacing:0;line-height:1.5}\n"
    + ".review-tool-deliver ol{margin:0 0 11px;padding-left:18px;list-style:decimal;font-size:11.5px;color:var(--rt-muted);line-height:1.75}\n"
    + ".review-tool-deliver ol li{list-style:decimal;padding-left:2px}\n"
    + ".review-tool-deliver ol strong{color:var(--rt-text);font-weight:650}\n"
    + ".review-tool-deliver .review-tool-btn--primary{\n"
    + "  height:42px;font-size:13.5px;background:linear-gradient(160deg,#F7C078,#E09A3F);color:#2A1C08;\n"
    + "  box-shadow:0 10px 24px -10px rgba(224,154,63,.9)\n"
    + "}\n"
    + ".review-tool-deliver .review-tool-btn--primary:hover{background:linear-gradient(160deg,#FFCB88,#EDA84C)}\n"
    + "\n"
    + "/* ---------- toasts ---------- */\n"
    + ".review-tool-toasts{\n"
    + "  position:fixed;z-index:60;left:50%;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 62px);\n"
    + "  transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;\n"
    + "  width:max-content;max-width:calc(100vw - 28px);pointer-events:none;\n"
    + "}\n"
    + ".review-tool-toast{\n"
    + "  display:flex;gap:9px;align-items:flex-start;padding:11px 14px;border-radius:var(--rt-r);\n"
    + "  background:rgba(21,28,41,.96);border:1px solid var(--rt-line);box-shadow:var(--rt-shadow);\n"
    + "  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);\n"
    + "  font-size:12.5px;line-height:1.5;max-width:340px;pointer-events:auto;\n"
    + "  animation:review-tool-toast-in .3s var(--rt-ease) both;\n"
    + "}\n"
    + ".review-tool-toast.is-out{animation:review-tool-toast-out .25s var(--rt-ease) forwards}\n"
    + "@keyframes review-tool-toast-in{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}\n"
    + "@keyframes review-tool-toast-out{to{opacity:0;transform:translateY(8px) scale(.97)}}\n"
    + ".review-tool-toast svg{width:16px;height:16px;flex:none;margin-top:1px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n"
    + ".review-tool-toast--ok svg{color:#4ADE80}\n"
    + ".review-tool-toast--info svg{color:var(--rt-accent)}\n"
    + ".review-tool-toast strong{display:block;font-weight:700;margin-bottom:2px}\n"
    + ".review-tool-toast span{color:var(--rt-muted)}\n"
    + "\n"
    + "/* ---------- modal ---------- */\n"
    + ".review-tool-modal{\n"
    + "  position:fixed;z-index:70;inset:0;display:grid;place-items:center;padding:20px;pointer-events:auto;\n"
    + "  background:rgba(6,12,22,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);\n"
    + "  animation:review-tool-fade .2s ease both;\n"
    + "}\n"
    + "@keyframes review-tool-fade{from{opacity:0}to{opacity:1}}\n"
    + ".review-tool-modal__card{\n"
    + "  width:100%;max-width:360px;padding:20px;border-radius:16px;background:var(--rt-surface-2);\n"
    + "  border:1px solid var(--rt-line);box-shadow:0 30px 70px -20px rgba(2,8,20,.7);\n"
    + "  animation:review-tool-bubble-in .26s var(--rt-ease) both;\n"
    + "}\n"
    + ".review-tool-modal__title{font-size:15px;font-weight:700;margin-bottom:7px}\n"
    + ".review-tool-modal__text{font-size:13px;color:var(--rt-muted);margin-bottom:17px;line-height:1.6}\n"
    + ".review-tool-modal__foot{display:flex;gap:8px;justify-content:flex-end}\n"
    + ".review-tool-modal .review-tool-btn--quiet{background:rgba(255,255,255,.1);color:var(--rt-text)}\n"
    + ".review-tool-modal .review-tool-btn--quiet:hover{background:rgba(255,255,255,.16)}\n"
    + ".review-tool-modal .review-tool-btn--danger{background:#E24A3F;color:#fff}\n"
    + ".review-tool-modal .review-tool-btn--danger:hover{background:#CC3E34}\n"
    + "\n"
    + "/* ---------- coach mark (primeira vez) ---------- */\n"
    + ".review-tool-coach{\n"
    + "  position:fixed;z-index:55;left:50%;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 62px);\n"
    + "  transform:translateX(-50%);width:max-content;max-width:calc(100vw - 28px);pointer-events:auto;\n"
    + "  display:flex;gap:11px;align-items:flex-start;padding:13px 15px;border-radius:var(--rt-r);\n"
    + "  background:var(--rt-accent);color:#fff;box-shadow:0 16px 40px -12px rgba(79,124,255,.8);\n"
    + "  animation:review-tool-coach-in .34s var(--rt-ease) both;\n"
    + "}\n"
    + "@keyframes review-tool-coach-in{\n"
    + "  from{opacity:0;transform:translateX(-50%) translateY(12px) scale(.96)}\n"
    + "  to{opacity:1;transform:translateX(-50%)}\n"
    + "}\n"
    + ".review-tool-coach svg{width:17px;height:17px;flex:none;margin-top:1px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n"
    + ".review-tool-coach strong{display:block;font-size:13px;margin-bottom:2px}\n"
    + ".review-tool-coach p{margin:0;font-size:12px;opacity:.92;line-height:1.5;max-width:260px}\n"
    + ".review-tool-coach button{margin-left:4px;align-self:center;padding:5px 11px;border-radius:8px;background:rgba(255,255,255,.2);font-size:12px;font-weight:650}\n"
    + ".review-tool-coach button:hover{background:rgba(255,255,255,.3)}\n"
    + "\n"
    + "/* ---------- modo revisão: cursor ---------- */\n"
    + "html.review-tool-active,html.review-tool-active *{cursor:crosshair!important}\n"
    + "html.review-tool-active #review-tool-root,html.review-tool-active #review-tool-root *{cursor:auto!important}\n"
    + "html.review-tool-active .review-tool-pin,html.review-tool-active #review-tool-root button{cursor:pointer!important}\n"
    + "html.review-tool-active #review-tool-root textarea{cursor:text!important}\n"
    + "\n"
    + "/* ---------- responsivo ---------- */\n"
    + "@media (max-width:640px){\n"
    + "  .review-tool-toolbar__brand{display:none}\n"
    + "  .review-tool-tbtn{padding:0 12px;font-size:12.5px}\n"
    + "  .review-tool-tbtn--toggle span{display:none}\n"
    + "  .review-tool-panel{width:100%;top:auto;height:82vh;border-left:0;border-top:1px solid var(--rt-line);border-radius:18px 18px 0 0;transform:translateY(102%)}\n"
    + "  .review-tool-panel.is-open{transform:none}\n"
    + "  .review-tool-bubble{width:calc(100vw - 24px)}\n"
    + "  .review-tool-coach p{max-width:180px}\n"
    + "  /* o painel vira bottom sheet e colidiria com a toolbar */\n"
    + "  #review-tool-root.is-panel-open .review-tool-toolbar{opacity:0;pointer-events:none;transform:translateX(-50%) translateY(150%)}\n"
    + "  #review-tool-root.is-panel-open .review-tool-toasts{bottom:auto;top:16px}\n"
    + "}\n"
    + "@media (prefers-reduced-motion:reduce){\n"
    + "  #review-tool-root *,#review-tool-root *::before,#review-tool-root *::after{\n"
    + "    animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important\n"
    + "  }\n"
    + "}\n";

  var styleEl = document.createElement('style');
  styleEl.id = 'review-tool-styles';
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ═══════════════ utilidades ═══════════════ */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html; /* apenas markup estático do próprio sistema */
    return n;
  }
  function now() { return new Date().toISOString(); }
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function trunc(s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* ═══════════════ StorageManager ═══════════════ */
  var Storage = {
    load: function () {
      try {
        var raw = localStorage.getItem(STORE_KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        return data && Array.isArray(data.comments) ? data : null;
      } catch (e) { return null; }
    },
    save: function (comments) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({
          version: FORMAT_VERSION, page: location.pathname, savedAt: now(), comments: comments
        }));
      } catch (e) { /* cota cheia ou modo privado: segue sem persistir */ }
    },
    getSetting: function (k) {
      try { return (JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {})[k]; } catch (e) { return undefined; }
    },
    setSetting: function (k, v) {
      try {
        var s = {};
        try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) {}
        s[k] = v;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      } catch (e) {}
    }
  };

  /* ═══════════════ ElementResolver ═══════════════ */
  var Resolver = {
    /* sobe na árvore até um elemento que faça sentido comentar */
    getReviewableElement: function (target) {
      if (!target || target.nodeType !== 1) return null;
      if (target.closest('#review-tool-root')) return null;
      var node = target;
      while (node && node !== document.body) {
        if (!TRIVIAL[node.tagName] && (node.matches(MEANINGFUL) || this.hasOwnBox(node))) return node;
        node = node.parentElement;
      }
      return target === document.body ? null : (target.parentElement || null);
    },
    /* div/figure sem semântica mas com presença visual própria */
    hasOwnBox: function (node) {
      if (node.tagName !== 'DIV') return false;
      var r = node.getBoundingClientRect();
      return r.width > 40 && r.height > 24;
    },
    cssPath: function (node) {
      var parts = [], depth = 0;
      while (node && node.nodeType === 1 && node !== document.documentElement && depth < 12) {
        var seg = node.tagName.toLowerCase();
        if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
        var parent = node.parentElement;
        if (parent) {
          var same = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === node.tagName; });
          if (same.length > 1) seg += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
        }
        parts.unshift(seg);
        node = parent; depth++;
      }
      return parts.join(' > ');
    },
    /* referência estável: id do autor > data-review-id > caminho estrutural */
    reference: function (node) {
      if (node.id && document.querySelectorAll('#' + CSS.escape(node.id)).length === 1) return '#' + CSS.escape(node.id);
      var existing = node.getAttribute(ATTR);
      if (existing) return '[' + ATTR + '="' + existing + '"]';
      return this.cssPath(node);
    },
    /* carimba um id de sessão para reencontrar rápido enquanto a página estiver aberta */
    stamp: function (node, id) {
      if (!node.getAttribute(ATTR)) node.setAttribute(ATTR, id);
      return node.getAttribute(ATTR);
    },
    describe: function (node) {
      var id = uid();
      return {
        element: this.reference(node),
        reviewId: this.stamp(node, 'rv-' + id),
        tag: node.tagName.toLowerCase(),
        text: trunc(node.textContent, 120),
        path: this.cssPath(node)
      };
    },
    /* tenta reencontrar o elemento na ordem: element > reviewId > path > tag+texto */
    find: function (c) {
      var node = this.q(c.element);
      if (!node && c.reviewId) node = this.q('[' + ATTR + '="' + c.reviewId + '"]');
      if (!node && c.path) node = this.q(c.path);
      if (!node && c.tag && c.text) {
        var list = document.querySelectorAll(c.tag), want = trunc(c.text, 120);
        for (var i = 0; i < list.length; i++) {
          if (list[i].closest('#review-tool-root')) continue;
          if (trunc(list[i].textContent, 120) === want) { node = list[i]; break; }
        }
      }
      if (node && node.closest('#review-tool-root')) node = null;
      /* recarimba para as próximas buscas do mesmo ciclo */
      if (node && c.reviewId && !node.getAttribute(ATTR)) node.setAttribute(ATTR, c.reviewId);
      return node;
    },
    q: function (sel) {
      if (!sel) return null;
      try { return document.querySelector(sel); } catch (e) { return null; }
    },
    isFixed: function (node) {
      var n = node;
      while (n && n !== document.body) {
        if (getComputedStyle(n).position === 'fixed') return true;
        n = n.parentElement;
      }
      return false;
    }
  };

  /* ═══════════════ estado ═══════════════ */
  var state = {
    reviewMode: false,
    comments: [],
    openId: null,        /* comentário com balão aberto */
    draft: null,         /* comentário novo ainda não salvo */
    panelOpen: false,
    hoverEl: null
  };

  var dom = {};   /* nós persistentes da interface */
  var pins = {};  /* id -> { btn, node, fixed } */

  /* ═══════════════ UIManager: construção da interface ═══════════════ */
  function buildUI() {
    var root = el('div', 'review-tool');
    root.id = 'review-tool-root';

    /* camadas de marcação */
    dom.layer = el('div', 'review-tool-layer');
    dom.layerFixed = el('div', 'review-tool-layer review-tool-layer--fixed');

    /* destaque de hover */
    dom.hl = el('div', 'review-tool-highlight');
    dom.hl.appendChild(el('span', 'review-tool-highlight__tag', ICONS.pencil + '<span>Clique para comentar</span>'));

    /* toolbar */
    dom.toolbar = el('div', 'review-tool-toolbar');
    dom.toolbar.setAttribute('role', 'toolbar');
    dom.toolbar.setAttribute('aria-label', 'Ferramenta de revisão');
    dom.toolbar.innerHTML =
      '<div class="review-tool-toolbar__brand"><span class="review-tool-toolbar__dot"></span>Revisão</div>' +
      '<button type="button" class="review-tool-tbtn review-tool-tbtn--toggle" data-rt="toggle" aria-pressed="false">' +
        ICONS.pencil + '<span>Revisar</span></button>' +
      '<span class="review-tool-toolbar__sep"></span>' +
      '<button type="button" class="review-tool-tbtn review-tool-tbtn--panel" data-rt="panel" aria-expanded="false">' +
        ICONS.chat + '<span class="review-tool-count" data-rt="count">0</span></button>';

    /* painel */
    dom.panel = el('aside', 'review-tool-panel');
    dom.panel.setAttribute('aria-label', 'Comentários da revisão');
    dom.panel.setAttribute('aria-hidden', 'true');
    dom.panel.innerHTML =
      '<div class="review-tool-panel__head">' +
        '<div class="review-tool-panel__title">Comentários<small data-rt="subtitle">Nenhuma marcação ainda</small></div>' +
        '<div class="review-tool-panel__tools">' +
          '<button type="button" class="review-tool-iconbtn" data-rt="import" aria-label="Importar revisão de um arquivo JSON" title="Importar revisão (.json)">' + ICONS.up + '</button>' +
          '<button type="button" class="review-tool-iconbtn" data-rt="exportHtml" aria-label="Exportar página com a revisão em HTML" title="Exportar página com revisão (.html)">' + ICONS.file + '</button>' +
          '<button type="button" class="review-tool-iconbtn" data-rt="closePanel" aria-label="Fechar painel">' + ICONS.close + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="review-tool-panel__list" data-rt="list"></div>' +
      '<div class="review-tool-deliver">' +
        '<div class="review-tool-deliver__head">' +
          '<span class="review-tool-deliver__icon">' + ICONS.send + '</span>' +
          '<span class="review-tool-deliver__title">Não esqueça de enviar sua revisão' +
            '<small>Quando terminar seus comentários, baixe o arquivo e envie para o desenvolvedor.</small></span>' +
        '</div>' +
        '<ol><li>Clique em <strong>Baixar revisão</strong>.</li>' +
        '<li>Um arquivo <strong>.json</strong> vai para o seu computador.</li>' +
        '<li><strong>Envie esse arquivo</strong> para nós.</li></ol>' +
        '<button type="button" class="review-tool-btn review-tool-btn--primary review-tool-btn--block" data-rt="export">' +
          ICONS.down + 'Baixar revisão</button>' +
      '</div>';

    dom.toasts = el('div', 'review-tool-toasts');
    dom.toasts.setAttribute('aria-live', 'polite');

    dom.file = el('input');
    dom.file.type = 'file';
    dom.file.accept = 'application/json,.json';
    dom.file.className = 'review-tool-sr';

    root.appendChild(dom.hl);
    root.appendChild(dom.layerFixed);
    root.appendChild(dom.toolbar);
    root.appendChild(dom.panel);
    root.appendChild(dom.toasts);
    root.appendChild(dom.file);
    document.body.appendChild(root);
    document.body.appendChild(dom.layer); /* fora do root: coordenadas do documento */
    dom.root = root;

    dom.count = dom.toolbar.querySelector('[data-rt="count"]');
    dom.list = dom.panel.querySelector('[data-rt="list"]');
    dom.subtitle = dom.panel.querySelector('[data-rt="subtitle"]');
    dom.btnToggle = dom.toolbar.querySelector('[data-rt="toggle"]');
    dom.btnPanel = dom.toolbar.querySelector('[data-rt="panel"]');
  }

  /* ═══════════════ toasts e modais ═══════════════ */
  function toast(kind, title, text, ms) {
    var t = el('div', 'review-tool-toast review-tool-toast--' + kind, (kind === 'ok' ? ICONS.check : ICONS.info) + '<div></div>');
    var box = t.lastChild;
    var s = el('strong'); s.textContent = title; box.appendChild(s);
    if (text) { var p = el('span'); p.textContent = text; box.appendChild(p); }
    dom.toasts.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { t.remove(); }, 260);
    }, ms || 4200);
  }

  function confirmModal(opts, onYes) {
    var m = el('div', 'review-tool-modal');
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="review-tool-modal__card">' +
      '<div class="review-tool-modal__title"></div><div class="review-tool-modal__text"></div>' +
      '<div class="review-tool-modal__foot">' +
        '<button type="button" class="review-tool-btn review-tool-btn--quiet" data-rt="no">' + (opts.no || 'Cancelar') + '</button>' +
        '<button type="button" class="review-tool-btn review-tool-btn--' + (opts.danger ? 'danger' : 'primary') + '" data-rt="yes"></button>' +
      '</div></div>';
    m.querySelector('.review-tool-modal__title').textContent = opts.title;
    m.querySelector('.review-tool-modal__text').textContent = opts.text;
    m.querySelector('[data-rt="yes"]').textContent = opts.yes || 'Confirmar';
    function close() { m.remove(); document.removeEventListener('keydown', esc, true); }
    function esc(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-rt="no"]')) close();
      else if (e.target.closest('[data-rt="yes"]')) { close(); onYes(); }
    });
    document.addEventListener('keydown', esc, true);
    dom.root.appendChild(m);
    m.querySelector('[data-rt="yes"]').focus();
  }

  /* ═══════════════ CommentManager ═══════════════ */
  var Comments = {
    renumber: function () {
      state.comments.forEach(function (c, i) { c.number = i + 1; });
    },
    add: function (node) {
      var info = Resolver.describe(node);
      var c = {
        id: uid(), number: state.comments.length + 1,
        element: info.element, reviewId: info.reviewId, tag: info.tag,
        text: info.text, path: info.path, comment: '',
        createdAt: now(), updatedAt: now()
      };
      state.comments.push(c);
      state.draft = c.id;
      renderPins();
      openBubble(c.id, true);
      refresh(false);
      return c;
    },
    get: function (id) {
      for (var i = 0; i < state.comments.length; i++) if (state.comments[i].id === id) return state.comments[i];
      return null;
    },
    save: function (id, text) {
      var c = this.get(id); if (!c) return;
      c.comment = text;
      c.updatedAt = now();
      state.draft = null;
      refresh(true);
    },
    remove: function (id) {
      state.comments = state.comments.filter(function (c) { return c.id !== id; });
      if (state.openId === id) closeBubble();
      if (state.draft === id) state.draft = null;
      this.renumber();
      renderPins();
      refresh(true);
    },
    discardDraft: function () {
      if (!state.draft) return;
      var id = state.draft;
      state.draft = null;
      state.comments = state.comments.filter(function (c) { return c.id !== id; });
      this.renumber();
      if (state.openId === id) { state.openId = null; if (dom.bubble) { dom.bubble.remove(); dom.bubble = null; } }
      renderPins();
      refresh(false);
    }
  };

  /* ═══════════════ pins ═══════════════ */
  function renderPins() {
    var seen = {};
    state.comments.forEach(function (c) {
      seen[c.id] = 1;
      var node = Resolver.find(c);
      var p = pins[c.id];
      if (!p) {
        var btn = el('button', 'review-tool-pin');
        btn.type = 'button';
        btn.dataset.rtPin = c.id;
        pins[c.id] = p = { btn: btn };
      }
      p.node = node;
      p.fixed = node ? Resolver.isFixed(node) : false;
      p.btn.textContent = String(c.number);
      p.btn.setAttribute('aria-label', 'Comentário ' + c.number + (node ? '' : ' (elemento não encontrado)'));
      p.btn.classList.toggle('is-orphan', !node);
      var target = p.fixed ? dom.layerFixed : dom.layer;
      if (p.btn.parentNode !== target) target.appendChild(p.btn);
      p.btn.style.display = node && state.reviewMode ? '' : 'none';
    });
    Object.keys(pins).forEach(function (id) {
      if (!seen[id]) { pins[id].btn.remove(); delete pins[id]; }
    });
    positionPins();
  }

  function positionPins() {
    var sx = window.pageXOffset, sy = window.pageYOffset;
    var reads = [];
    Object.keys(pins).forEach(function (id) {
      var p = pins[id];
      if (!p.node || p.btn.style.display === 'none') return;
      reads.push([p, p.node.getBoundingClientRect()]);
    });
    reads.forEach(function (pair) {
      var p = pair[0], r = pair[1];
      var x = r.right - 10, y = r.top + 12;
      if (!p.fixed) { x += sx; y += sy; }
      p.btn.style.left = Math.round(x) + 'px';
      p.btn.style.top = Math.round(y) + 'px';
    });
    if (state.openId && dom.bubble) positionBubble();
  }

  /* ═══════════════ balão ═══════════════ */
  /* remove só a interface, sem gravar nada */
  function destroyBubble() {
    if (!dom.bubble) return;
    if (state.openId && pins[state.openId]) pins[state.openId].btn.classList.remove('is-open');
    dom.bubble.remove();
    dom.bubble = null;
    state.openId = null;
    renderList();
  }

  /* fecha gravando o que estiver em edição (commit === false cancela) */
  function closeBubble(commit) {
    if (!dom.bubble) return;
    if (commit !== false && state.openId) {
      var ta = dom.bubble.querySelector('textarea');
      var c = Comments.get(state.openId);
      if (ta && c) {
        var v = ta.value.trim();
        if (v) Comments.save(c.id, v);
        else if (state.draft === c.id) { Comments.discardDraft(); return; }
      }
    }
    destroyBubble();
  }

  /* clique na bolinha: abre se fechado, fecha se já aberto */
  function togglePin(id) {
    if (state.openId === id) closeBubble();
    else openBubble(id, false);
  }

  function openBubble(id, editing) {
    if (dom.bubble) destroyBubble();
    var c = Comments.get(id); if (!c) return;
    var p = pins[id];
    state.openId = id;
    if (p) p.btn.classList.add('is-open');

    var b = el('div', 'review-tool-bubble');
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Comentário ' + c.number);
    dom.bubble = b;

    var head = el('div', 'review-tool-bubble__head',
      '<span class="review-tool-bubble__num"></span><span class="review-tool-bubble__title"></span>' +
      '<button type="button" class="review-tool-bubble__close" data-rt="x" aria-label="Fechar">' + ICONS.close + '</button>');
    head.querySelector('.review-tool-bubble__num').textContent = c.number;
    head.querySelector('.review-tool-bubble__title').textContent = 'Comentário #' + c.number;
    b.appendChild(head);

    var chip = el('div', 'review-tool-bubble__chip', '<code></code><span></span>');
    chip.querySelector('code').textContent = '<' + c.tag + '>';
    chip.querySelector('span').textContent = trunc(c.text, 48) || '—';
    b.appendChild(chip);

    if (editing) renderEditor(b, c); else renderReader(b, c);

    dom.root.appendChild(b);
    positionBubble();
    if (editing) { var ta = b.querySelector('textarea'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }
  }

  function renderReader(b, c) {
    var body = el('div', 'review-tool-bubble__body');
    body.textContent = c.comment;
    b.appendChild(body);
    var meta = el('div', 'review-tool-bubble__meta');
    var d = new Date(c.updatedAt);
    meta.textContent = (c.updatedAt !== c.createdAt ? 'Editado em ' : 'Criado em ') +
      d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    b.appendChild(meta);
    var foot = el('div', 'review-tool-bubble__foot',
      '<button type="button" class="review-tool-btn review-tool-btn--danger" data-rt="del">Excluir</button>' +
      '<button type="button" class="review-tool-btn review-tool-btn--quiet" data-rt="edit">Editar</button>');
    b.appendChild(foot);
  }

  function renderEditor(b, c) {
    var ta = el('textarea');
    ta.placeholder = 'Escreva seu comentário...';
    ta.value = c.comment || '';
    ta.setAttribute('aria-label', 'Comentário ' + c.number);
    b.appendChild(ta);
    b.appendChild(el('div', 'review-tool-bubble__warn review-tool-sr', ''));
    var foot = el('div', 'review-tool-bubble__foot',
      '<span class="review-tool-bubble__hint">⌘/Ctrl + Enter</span>' +
      '<button type="button" class="review-tool-btn review-tool-btn--quiet" data-rt="cancel">Cancelar</button>' +
      '<button type="button" class="review-tool-btn review-tool-btn--primary" data-rt="ok">Salvar</button>');
    b.appendChild(foot);
  }

  function positionBubble() {
    var b = dom.bubble; if (!b) return;
    var p = pins[state.openId]; if (!p || !p.node) return;
    var r = p.node.getBoundingClientRect();
    var bw = b.offsetWidth, bh = b.offsetHeight;
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var M = 12;

    /* ancora no canto do elemento; vira para cima/esquerda se faltar espaço */
    var x = r.right - 10 + 18;
    var y = r.top + 12 + 18;
    if (x + bw > vw - M) x = Math.max(M, r.right - 10 - bw - 18);
    if (y + bh > vh - M) y = Math.max(M, r.top + 12 - bh - 18);
    x = clamp(x, M, Math.max(M, vw - bw - M));
    y = clamp(y, M, Math.max(M, vh - bh - M));

    b.style.left = Math.round(x) + 'px';
    b.style.top = Math.round(y) + 'px';
  }

  /* ═══════════════ destaque ═══════════════ */
  function showHighlight(node, focusMode) {
    var r = node.getBoundingClientRect();
    if (!r.width && !r.height) return hideHighlight();
    dom.hl.classList.toggle('review-tool-highlight--focus', !!focusMode);
    dom.hl.classList.toggle('review-tool-highlight--below', r.top < 34);
    dom.hl.style.width = r.width + 'px';
    dom.hl.style.height = r.height + 'px';
    dom.hl.style.transform = 'translate3d(' + r.left + 'px,' + r.top + 'px,0)';
    dom.hl.classList.add('is-on');
  }
  function hideHighlight() { dom.hl.classList.remove('is-on'); state.hoverEl = null; }

  /* ═══════════════ painel / lista ═══════════════ */
  function renderList() {
    dom.list.textContent = '';
    if (!state.comments.length) {
      var empty = el('div', 'review-tool-empty', ICONS.empty +
        '<strong>Nenhum comentário ainda</strong>' +
        '<p>Ative o modo de revisão e clique em qualquer parte do site para deixar uma observação.</p>');
      dom.list.appendChild(empty);
      return;
    }
    state.comments.forEach(function (c) {
      var node = Resolver.find(c);
      var item = el('button', 'review-tool-item' + (state.openId === c.id ? ' is-active' : '') + (node ? '' : ' is-orphan'));
      item.type = 'button';
      item.dataset.rtItem = c.id;

      var num = el('span', 'review-tool-item__num'); num.textContent = c.number;
      var body = el('div', 'review-tool-item__body');
      var txt = el('div', 'review-tool-item__text'); txt.textContent = c.comment || '(sem texto)';
      var ref = el('div', 'review-tool-item__ref');
      var code = el('code'); code.textContent = '<' + c.tag + '>';
      ref.appendChild(code);
      ref.appendChild(document.createTextNode(' ' + (trunc(c.text, 42) || c.element)));
      body.appendChild(txt); body.appendChild(ref);
      if (!node) {
        var w = el('div', 'review-tool-item__warn');
        w.textContent = '⚠ Elemento não encontrado · ' + c.element;
        body.appendChild(w);
      }
      item.appendChild(num); item.appendChild(body);
      dom.list.appendChild(item);
    });
  }

  function refresh(persist) {
    Comments.renumber();
    var n = state.comments.filter(function (c) { return c.comment; }).length;
    dom.count.textContent = n;
    dom.subtitle.textContent = n === 0 ? 'Nenhuma marcação ainda'
      : n === 1 ? '1 comentário nesta página' : n + ' comentários nesta página';
    Object.keys(pins).forEach(function (id) {
      var c = Comments.get(id);
      if (c) pins[id].btn.textContent = String(c.number);
    });
    renderList();
    if (persist) Storage.save(state.comments.filter(function (c) { return c.comment; }));
  }

  function setPanel(open) {
    state.panelOpen = open;
    dom.panel.classList.toggle('is-open', open);
    dom.root.classList.toggle('is-panel-open', open);
    dom.panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    dom.btnPanel.classList.toggle('is-on', open);
    dom.btnPanel.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* ═══════════════ ReviewManager ═══════════════ */
  function setReviewMode(on) {
    state.reviewMode = on;
    document.documentElement.classList.toggle('review-tool-active', on);
    dom.toolbar.classList.toggle('is-active', on);
    dom.btnToggle.classList.toggle('is-on', on);
    dom.btnToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    dom.btnToggle.querySelector('span').textContent = on ? 'Revisando' : 'Revisar';
    if (!on) { hideHighlight(); closeBubble(); hideCoach(); }
    renderPins();
    if (on && !Storage.getSetting('coachSeen')) showCoach();
  }

  function showCoach() {
    if (dom.coach) return;
    var c = el('div', 'review-tool-coach', ICONS.pencil +
      '<div><strong>Modo de revisão ativo</strong><p>Clique em qualquer texto, imagem ou botão do site para deixar um comentário.</p></div>' +
      '<button type="button" data-rt="coachOk">Entendi</button>');
    dom.coach = c;
    dom.root.appendChild(c);
    setTimeout(hideCoach, 9000);
  }
  function hideCoach() {
    if (!dom.coach) return;
    Storage.setSetting('coachSeen', true);
    dom.coach.remove();
    dom.coach = null;
  }

  function focusComment(id) {
    var c = Comments.get(id); if (!c) return;
    var node = Resolver.find(c);
    if (!node) { toast('info', 'Elemento não encontrado', 'O trecho comentado não existe mais nesta versão da página.'); return; }
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () {
      positionPins();
      showHighlight(node, true);
      setTimeout(hideHighlight, 1800);
      openBubble(id, false);
    }, 420);
  }

  /* ═══════════════ ExportManager ═══════════════ */
  var Exporter = {
    payload: function () {
      return {
        reviewVersion: FORMAT_VERSION,
        site: SITE_NAME,
        page: location.pathname,
        url: location.href,
        exportedAt: now(),
        comments: state.comments.filter(function (c) { return c.comment; })
      };
    },
    stamp: function () {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    download: function (blob, name) {
      var url = URL.createObjectURL(blob);
      var a = el('a');
      a.href = url; a.download = name;
      /* precisa nascer dentro de #review-tool-root: se o clique programático
         cair fora dele, o listener de clique do próprio modo de revisão
         (que está ativo nesse momento) o interpreta como um clique comum
         do site e cria um comentário fantasma em cima deste link */
      dom.root.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    },
    json: function () {
      if (!state.comments.filter(function (c) { return c.comment; }).length) {
        toast('info', 'Nenhum comentário para baixar', 'Faça pelo menos uma marcação antes de exportar.');
        return;
      }
      var name = 'revisao-site-' + this.stamp() + '.json';
      this.download(new Blob([JSON.stringify(this.payload(), null, 2)], { type: 'application/json' }), name);
      toast('ok', 'Revisão baixada!', 'Envie o arquivo "' + name + '" para o desenvolvedor.', 7000);
    },
    html: function () {
      var clone = document.documentElement.cloneNode(true);
      var r = clone.querySelector('#review-tool-root'); if (r) r.remove();
      var lay = clone.querySelector('.review-tool-layer'); if (lay) lay.remove();
      clone.classList.remove('review-tool-active');
      var data = el('script');
      data.id = 'review-tool-embedded-data';
      data.type = 'application/json';
      data.textContent = JSON.stringify(this.payload());
      var body = clone.querySelector('body');
      if (body) body.appendChild(data);
      var html = '<!DOCTYPE html>\n' + clone.outerHTML;
      var name = 'revisao-site-' + this.stamp() + '.html';
      this.download(new Blob([html], { type: 'text/html;charset=utf-8' }), name);
      toast('ok', 'Página exportada', 'Cópia da página com as marcações salva como "' + name + '".', 6000);
    },
    importFile: function (file) {
      var reader = new FileReader();
      reader.onload = function () {
        var data;
        try { data = JSON.parse(String(reader.result)); } catch (e) {
          toast('info', 'Arquivo inválido', 'Não foi possível ler este JSON.'); return;
        }
        if (!data || !Array.isArray(data.comments)) {
          toast('info', 'Arquivo inválido', 'O arquivo não contém uma lista de comentários.'); return;
        }
        if (data.reviewVersion && data.reviewVersion > FORMAT_VERSION) {
          toast('info', 'Versão mais nova', 'Este arquivo foi gerado por uma versão mais recente da ferramenta.');
        }
        var apply = function () {
          state.comments = data.comments.map(function (c, i) {
            return {
              id: c.id || uid(), number: i + 1,
              element: c.element || '', reviewId: c.reviewId || '', tag: c.tag || 'div',
              text: c.text || '', path: c.path || '', comment: String(c.comment || ''),
              createdAt: c.createdAt || now(), updatedAt: c.updatedAt || c.createdAt || now()
            };
          });
          pins = {};
          dom.layer.textContent = ''; dom.layerFixed.textContent = '';
          renderPins(); refresh(true); setPanel(true);
          var missing = state.comments.filter(function (c) { return !Resolver.find(c); }).length;
          toast('ok', 'Revisão importada', state.comments.length + ' comentário(s) carregado(s)' +
            (missing ? ' · ' + missing + ' sem elemento correspondente' : '') + '.', 6000);
        };
        if (state.comments.filter(function (c) { return c.comment; }).length) {
          confirmModal({
            title: 'Substituir comentários?',
            text: 'Já existem comentários nesta página. Deseja substituí-los pela revisão importada?',
            yes: 'Importar', no: 'Cancelar'
          }, apply);
        } else apply();
      };
      reader.readAsText(file);
    }
  };

  /* ═══════════════ eventos ═══════════════ */
  function isInsideTool(node) {
    return !!(node && node.closest && (node.closest('#review-tool-root') || node.closest('.review-tool-bubble') || node.closest('.review-tool-layer')));
  }

  function bindEvents() {
    /* — toolbar / painel — */
    dom.toolbar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-rt]'); if (!b) return;
      var a = b.dataset.rt;
      if (a === 'toggle') setReviewMode(!state.reviewMode);
      else if (a === 'panel') setPanel(!state.panelOpen);
    });

    dom.panel.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-rt]');
      if (b) {
        var a = b.dataset.rt;
        if (a === 'closePanel') return setPanel(false);
        if (a === 'export') return Exporter.json();
        if (a === 'exportHtml') return Exporter.html();
        if (a === 'import') return dom.file.click();
      }
      var item = e.target.closest('[data-rt-item]');
      if (item) {
        if (!state.reviewMode) setReviewMode(true);
        focusComment(item.dataset.rtItem);
      }
    });

    dom.file.addEventListener('change', function () {
      if (dom.file.files && dom.file.files[0]) Exporter.importFile(dom.file.files[0]);
      dom.file.value = '';
    });

    /* — coach — */
    dom.root.addEventListener('click', function (e) {
      if (e.target.closest('[data-rt="coachOk"]')) hideCoach();
    });

    /* — pins e balão (delegado no documento, fase de captura) — */
    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('mousedown', onDocumentDown, true);
    document.addEventListener('pointerdown', onDocumentDown, true);

    /* — hover — */
    var rafHover = 0;
    document.addEventListener('pointermove', function (e) {
      if (!state.reviewMode || e.pointerType === 'touch') return;
      if (rafHover) return;
      rafHover = requestAnimationFrame(function () {
        rafHover = 0;
        if (isInsideTool(e.target)) return hideHighlight();
        var node = Resolver.getReviewableElement(e.target);
        if (!node) return hideHighlight();
        if (node === state.hoverEl && dom.hl.classList.contains('is-on')) return;
        state.hoverEl = node;
        showHighlight(node, false);
      });
    }, { passive: true });

    document.addEventListener('pointerleave', hideHighlight);

    /* — sincronização de posições — */
    var rafSync = 0, scrollTimer = 0;
    function sync() {
      if (rafSync) return;
      rafSync = requestAnimationFrame(function () { rafSync = 0; positionPins(); });
    }
    /* pins vivem em coordenadas do documento: o scroll não exige reposicionar,
       só um ajuste no fim para capturar animações de entrada do site */
    window.addEventListener('scroll', function () {
      if (state.reviewMode && state.hoverEl) hideHighlight();
      if (Object.keys(pins).length) {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(sync, 120);
      }
      if (dom.bubble) positionBubble();
    }, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(sync).observe(document.body);
    dom.sync = sync;

    /* — teclado — */
    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if (e.key === 'Escape') {
        if (dom.bubble) {
          if (state.draft) Comments.discardDraft(); else closeBubble(false);
          e.preventDefault(); return;
        }
        if (state.panelOpen) { setPanel(false); e.preventDefault(); return; }
        if (state.reviewMode) { setReviewMode(false); e.preventDefault(); }
        return;
      }
      if (typing) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && dom.bubble) {
          var ok = dom.bubble.querySelector('[data-rt="ok"]');
          if (ok) { ok.click(); e.preventDefault(); }
        }
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setReviewMode(!state.reviewMode); e.preventDefault();
      }
    }, true);
  }

  function onDocumentDown(e) {
    if (!state.reviewMode) return;
    if (isInsideTool(e.target)) return;
    /* impede que o site reaja (sliders, steppers, menus) antes do clique */
    e.preventDefault();
    e.stopPropagation();
  }

  function onDocumentClick(e) {
    /* ações da própria ferramenta */
    var pin = e.target.closest ? e.target.closest('[data-rt-pin]') : null;
    if (pin) {
      e.preventDefault(); e.stopPropagation();
      togglePin(pin.dataset.rtPin);
      return;
    }
    if (dom.bubble && dom.bubble.contains(e.target)) {
      var b = e.target.closest('button[data-rt]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var id = state.openId, c = Comments.get(id);
      var act = b.dataset.rt;
      if (act === 'x') { closeBubble(); }
      else if (act === 'cancel') { if (state.draft === id) Comments.discardDraft(); else openBubble(id, false); }
      else if (act === 'edit') { openBubble(id, true); }
      else if (act === 'del') {
        confirmModal({ title: 'Excluir este comentário?', text: 'O comentário #' + c.number + ' será removido desta revisão.', yes: 'Excluir', danger: true },
          function () { Comments.remove(id); toast('ok', 'Comentário excluído'); });
      } else if (act === 'ok') {
        var ta = dom.bubble.querySelector('textarea');
        var v = ta.value.trim();
        if (!v) {
          var warn = dom.bubble.querySelector('.review-tool-bubble__warn');
          warn.classList.remove('review-tool-sr');
          warn.textContent = 'Digite um comentário antes de salvar.';
          ta.focus();
          return;
        }
        Comments.save(id, v);
        destroyBubble();   /* salvo → recolhe, fica só a bolinha */
        toast('ok', 'Comentário salvo', 'Marcação #' + c.number + ' registrada.', 2600);
      }
      return;
    }
    if (isInsideTool(e.target)) return;
    if (!state.reviewMode) return;

    e.preventDefault();
    e.stopPropagation();

    /* um balão aberto? o primeiro clique fora apenas confirma e fecha */
    if (dom.bubble) { closeBubble(); return; }

    var node = Resolver.getReviewableElement(e.target);
    if (!node) return;
    hideHighlight();
    Comments.add(node);
  }

  /* ═══════════════ inicialização ═══════════════ */
  function restore() {
    var embedded = document.getElementById('review-tool-embedded-data');
    var data = Storage.load();
    if (!data && embedded) {
      try { data = JSON.parse(embedded.textContent); } catch (e) { data = null; }
    }
    if (!data || !data.comments) return;
    state.comments = data.comments.map(function (c, i) {
      return {
        id: c.id || uid(), number: i + 1,
        element: c.element || '', reviewId: c.reviewId || '', tag: c.tag || 'div',
        text: c.text || '', path: c.path || '', comment: String(c.comment || ''),
        createdAt: c.createdAt || now(), updatedAt: c.updatedAt || c.createdAt || now()
      };
    });
  }

  function revealToolbar() {
    dom.toolbar.classList.add('is-ready');
    dom.sync && dom.sync();
  }

  function start() {
    buildUI();
    restore();
    bindEvents();
    renderPins();
    refresh(false);

    /* espera o preloader do site sair de cena antes de mostrar a toolbar
       (só entra em ação se o site tiver um elemento #preloader; em
       qualquer outro site sem esse id, revealToolbar() já roda direto) */
    var pre = document.getElementById('preloader');
    if (pre && !pre.classList.contains('is-done')) {
      var done = false;
      var finish = function () { if (done) return; done = true; obs.disconnect(); revealToolbar(); };
      var obs = new MutationObserver(function () { if (!document.body.contains(pre) || pre.classList.contains('is-done')) finish(); });
      obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      setTimeout(finish, 3800);
    } else revealToolbar();

    /* reposiciona quando fontes/imagens terminam de carregar */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { dom.sync && dom.sync(); });
    window.addEventListener('load', function () { setTimeout(function () { dom.sync && dom.sync(); }, 200); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
