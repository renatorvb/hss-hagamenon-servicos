
SISTEMA DE REVISÃO VISUAL — INSTRUÇÕES PARA CLAUDE CODE

Este documento especifica um sistema de revisão visual que deve ser
ADICIONADO ao site existente neste projeto.

IMPORTANTE:

Antes de modificar qualquer coisa, analise cuidadosamente o projeto atual.

NÃO recrie o site do zero.

NÃO substitua o design existente.

NÃO remova funcionalidades existentes.

NÃO altere conteúdo existente sem necessidade.

O sistema de revisão deve ser implementado como uma camada independente
sobre o site atual.

A implementação deve preservar:
- layout;
- responsividade;
- animações;
- interações;
- navegação;
- estilos;
- conteúdo;
- componentes existentes.


Objetivo
Adicionar ao website existente neste projeto um sistema profissional de revisão visual e comentários, permitindo que um cliente abra o site, ative um "Modo de Revisão", clique diretamente em qualquer elemento da página e deixe um comentário associado àquele elemento.

O sistema deve funcionar como uma camada sobre o site existente, sem destruir ou modificar desnecessariamente o design atual.

O cliente poderá fazer várias marcações, visualizar os comentários, editar ou excluir comentários e, ao finalizar, exportar um arquivo JSON contendo toda a revisão.

O desenvolvedor poderá posteriormente importar esse JSON no site e visualizar novamente todas as marcações e comentários.

ATENÇÃO: tentar USAR UM UX e UI PERFEITO. Tem que ser super intuitivo de usar.

1. REGRA MAIS IMPORTANTE: PRESERVAR O SITE EXISTENTE 
Este é um projeto existente.

Antes de alterar qualquer arquivo:

Analise toda a estrutura atual do projeto.
Identifique o arquivo principal da página.
Identifique como HTML, CSS e JavaScript estão organizados.
Entenda o design atual.
Entenda os componentes e interações existentes.
Entenda como a página é responsiva.
Identifique se já existe algum sistema de build.
NÃO faça:
Não recrie o site do zero.
Não substitua o design existente.
Não remova conteúdo.
Não simplifique a página.
Não remover funcionalidades existentes.
Não alterar textos existentes.
Não substituir imagens.
Não remover animações.
Não alterar navegação.
Não modificar o layout sem necessidade.
O sistema de revisão deve ser uma camada independente sobre o site existente.

Se for possível implementar tudo em um único HTML, faça isso.

Se a estrutura atual do projeto utilizar arquivos separados, preserve a arquitetura existente e faça a integração mínima necessária.

2. TECNOLOGIA
A ferramenta de revisão deve utilizar apenas tecnologias nativas.

Preferência absoluta por:

HTML
CSS
JavaScript Vanilla
Não utilizar:

React
Vue
Angular
jQuery
bibliotecas de UI
bibliotecas de screenshot
frameworks
npm
backend
banco de dados
Supabase
Firebase
APIs externas
CDN
Não adicionar dependências externas apenas para implementar o sistema de revisão.

O objetivo é que o sistema possa funcionar sem servidor próprio e sem banco de dados.

3. CONCEITO DA FERRAMENTA
A experiência deve ser semelhante às melhores ferramentas profissionais de revisão visual de websites.

O cliente vê o site normalmente.

Existe uma pequena interface discreta, preferencialmente no canto inferior da tela:

┌─────────────────────────────────────────────┐
│ ✎ Revisar    💬 0 comentários    ⚙          │
└─────────────────────────────────────────────┘
Ao clicar em:

✎ Modo de revisão

o sistema entra em modo de revisão.

A partir desse momento:

passar o mouse sobre elementos mostra um destaque;
clicar em um elemento cria uma marcação;
uma bolinha numerada aparece;
um balão de comentário abre;
o cliente escreve o comentário;
salva;
pode continuar criando outras marcações.
4. MODO NORMAL
Quando o modo de revisão estiver DESATIVADO:

O site deve funcionar exatamente como antes.

Isso significa:

links funcionam;
botões funcionam;
menus funcionam;
animações funcionam;
hover funciona;
formulários funcionam;
navegação funciona;
scroll funciona normalmente.
Nenhuma marcação deve aparecer.

Nenhuma borda de revisão deve aparecer.

Nenhum comportamento do sistema de revisão deve interferir no site.

5. MODO DE REVISÃO
Quando ativado:

reviewMode = true
O sistema deve:

capturar os cliques relevantes;
identificar o elemento clicado;
mostrar destaque ao passar o mouse;
permitir criar comentários;
mostrar marcações;
mostrar contador;
permitir editar/excluir;
permitir exportar;
permitir importar.
Criar uma forma visual clara para indicar que o modo revisão está ativo.

Por exemplo:

● MODO DE REVISÃO ATIVO
ou uma pequena alteração de cor na toolbar.

6. HOVER DOS ELEMENTOS
Enquanto o modo revisão estiver ativo, quando o cliente passar o mouse sobre um elemento relevante:

mostrar uma borda azul/translúcida.

Exemplo:

┌──────────────────────────────┐
│ TÍTULO DO SITE               │
└──────────────────────────────┘
Ao passar o mouse:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ TÍTULO DO SITE               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Pode aparecer uma pequena etiqueta:

Clique para comentar
O efeito deve ser elegante e discreto.

Não alterar permanentemente o layout do elemento.

Não adicionar bordas diretamente ao elemento de forma que altere dimensões.

Preferencialmente utilizar uma camada de highlight posicionada sobre o elemento usando:

element.getBoundingClientRect()
7. IDENTIFICAÇÃO DO ELEMENTO CLICADO
Este é um dos requisitos mais importantes.

Quando o usuário clicar:

event.target
deve ser utilizado para identificar o elemento.

Exemplo:

document.addEventListener("click", function(event) {

    if (!reviewMode) return;

    const element = event.target;

    // identificar elemento
    // criar comentário
});
O comentário NÃO deve ser associado apenas a coordenadas da tela.

Não salvar apenas:

{
    "x": 450,
    "y": 300
}
As coordenadas podem ser utilizadas somente para posicionamento visual.

A referência principal deve ser o próprio elemento DOM.

8. REFERÊNCIA DO ELEMENTO
Criar uma função:

getElementReference(element)
Ela deve tentar identificar o elemento da maneira mais robusta possível.

Prioridade:

1. ID
Se:

<h1 id="hero-title">
usar:

#hero-title
2. data-review-id
Se existir:

<h1 data-review-id="hero-title">
usar:

[data-review-id="hero-title"]
3. Gerar data-review-id
Se o elemento não possuir uma referência adequada, gerar automaticamente:

data-review-id="review-element-001"
Depois:

[data-review-id="review-element-001"]
4. Fallback
Salvar também informações auxiliares que permitam localizar o elemento posteriormente.

Por exemplo:

{
    "element": "#hero-title",
    "tag": "h1",
    "text": "Soluções para sua empresa",
    "path": "body > main > section.hero > h1"
}
O campo element é a referência principal.

Os demais campos são fallback.

9. CUIDADO COM event.target
Um clique em:

<button id="hero-cta">
    <span>Saiba mais</span>
</button>
pode gerar:

event.target
como o <span>.

Nesse caso, analisar a árvore DOM para determinar o elemento relevante.

Preferencialmente considerar elementos semanticamente relevantes como:

button;
a;
input;
textarea;
img;
h1-h6;
p;
section;
article;
header;
footer;
divs importantes.
Evitar criar comentários para elementos internos irrelevantes quando houver um elemento pai claramente mais apropriado.

Criar uma função como:

getReviewableElement(target)
para resolver isso.

10. CLIQUE PARA CRIAR COMENTÁRIO
Ao clicar em um elemento durante o modo revisão:

impedir temporariamente a ação original do clique;
identificar o elemento;
criar um comentário;
gerar número sequencial;
criar uma bolinha;
posicionar a bolinha;
abrir o balão;
colocar foco automaticamente no textarea.
Exemplo:

              ┌──────────────────────┐
              │ TÍTULO DO SITE       │
              └──────────────────────┘
                         │
                         ▼
                        ● 1

                  ┌───────────────────────┐
                  │ 💬 Comentário #1      │
                  │                       │
                  │                       │
                  │ ____________________  │
                  │                       │
                  │ [Cancelar] [Salvar]  │
                  └───────────────────────┘
11. BOLINHAS DE MARCAÇÃO
Cada comentário deve possuir uma bolinha numerada.

Exemplo:

●1
●2
●3
●4
Design sugerido:

círculo azul;
número branco;
sombra;
aproximadamente 26px;
cursor pointer;
z-index elevado;
animação discreta ao aparecer.
Criar classes com namespace próprio:

.review-tool-pin
.review-tool-pin-number
Nunca utilizar nomes genéricos como:

.pin
.active
.modal
.container
.button
12. POSICIONAMENTO DAS BOLINHAS
Utilizar:

element.getBoundingClientRect()
para determinar onde colocar visualmente a marcação.

A posição deve ser atualizada durante:

scroll;
resize;
alterações de layout.
As coordenadas são apenas posicionamento visual.

A identidade do comentário continua sendo o elemento DOM.

Se o elemento sair da tela durante scroll, a marcação deve continuar corretamente associada a ele.

13. BALÃO DE COMENTÁRIO
Ao criar um comentário, abrir um balão.

Exemplo:

┌────────────────────────────────────┐
│ 💬 Comentário #1                   │
│                                    │
│ Trocar este texto...               │
│                                    │
│                                    │
│ [Cancelar]             [Salvar]    │
└────────────────────────────────────┘
O balão deve:

aparecer próximo à marcação;
nunca sair da viewport;
reposicionar-se automaticamente se estiver perto das bordas;
ter sombra;
border-radius;
fundo branco;
aparência profissional.
14. TEXTAREA
O textarea deve receber foco automaticamente.

Placeholder:

Escreva seu comentário...
Não permitir salvar comentário vazio.

Se o usuário tentar salvar vazio:

mostrar uma pequena mensagem:

Digite um comentário antes de salvar.
15. CANCELAR NOVO COMENTÁRIO
Se o cliente clicar:

Cancelar

remover:

comentário;
bolinha;
balão.
Não salvar nada no localStorage.

16. SALVAR COMENTÁRIO
Ao salvar:

registrar comentário;
atualizar localStorage;
fechar o balão;
manter a bolinha;
atualizar contador;
atualizar lista geral.
17. EXPANDIR E RECOLHER
Depois de salvo, o balão deve ficar recolhido.

Somente a bolinha permanece:

●1
Ao clicar:

●1

┌─────────────────────────────┐
│ Comentário #1               │
│                             │
│ Trocar esse título...       │
│                             │
│ [Editar]      [Excluir]     │
└─────────────────────────────┘
Ao clicar novamente na bolinha, recolher.

Somente um comentário deve ficar expandido por vez.

18. EDITAR
Botão:

Editar
Ao clicar:

substituir texto por textarea;
permitir alteração;
mostrar Salvar;
mostrar Cancelar.
Ao salvar:

atualizar texto;
atualizar updatedAt;
salvar no localStorage;
atualizar interface.
19. EXCLUIR
Botão:

Excluir
Ao clicar:

mostrar:

Excluir este comentário?

[Cancelar] [Excluir]
Se confirmado:

remover comentário;
remover bolinha;
atualizar contador;
atualizar localStorage;
atualizar lista.
20. CONTADOR
Mostrar algo como:

💬 0 comentários
ou:

💬 4 comentários
Atualizar automaticamente.

21. PAINEL DE COMENTÁRIOS
Criar um botão:

Ver comentários
Ao clicar, abrir painel lateral ou modal.

Exemplo:

┌────────────────────────────────┐
│ COMENTÁRIOS               ✕    │
├────────────────────────────────┤
│                                │
│ ● 1                            │
│ Trocar o título principal      │
│                                │
│ ● 2                            │
│ Aumentar o botão               │
│                                │
│ ● 3                            │
│ Alterar a imagem               │
│                                │
└────────────────────────────────┘
Cada item deve ser clicável.

Ao clicar:

localizar o elemento;
fazer scroll suave;
destacar o elemento;
expandir o comentário.
22. HIGHLIGHT DO COMENTÁRIO
Quando o usuário selecionar um comentário:

destacar o elemento associado.

Exemplo:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ TÍTULO DO SITE                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Utilizar uma animação suave.

Depois de alguns segundos, remover o destaque.

23. LOCALSTORAGE
Salvar automaticamente no:

localStorage
Usar uma chave específica:

site-review-comments
Pode também incluir uma chave:

site-review-settings
Salvar:

comentários;
configuração necessária;
versão do formato.
Exemplo:

{
    "version": 1,
    "page": "/",
    "comments": [
        {
            "id": "comment-001",
            "number": 1,
            "element": "#hero-title",
            "tag": "h1",
            "text": "Soluções para sua empresa",
            "path": "body > main > section.hero > h1",
            "comment": "Trocar este título",
            "createdAt": "2026-09-14T12:00:00Z",
            "updatedAt": "2026-09-14T12:00:00Z"
        }
    ]
}
24. RECUPERAÇÃO APÓS RECARREGAR
Ao abrir novamente a página:

carregar localStorage;
localizar os elementos;
reconstruir as marcações;
reconstruir o contador;
permitir abrir/editar/excluir.
Se um elemento não for encontrado:

não apagar o comentário.

Mostrar como:

⚠ Elemento não encontrado
25. RESOLUÇÃO DE ELEMENTOS
Criar:

findElementByReference(comment)
A tentativa deve ocorrer na seguinte ordem:

element;
data-review-id;
id;
path salvo;
fallback baseado em tag/texto, se for seguro.
Não usar o texto sozinho como identificador principal.

26. ELEMENTOS NÃO ENCONTRADOS
Se um comentário não puder ser associado ao elemento atual:

mostrar no painel:

⚠ Elemento não encontrado

Comentário #4

"Trocar esse texto"

Referência original:
#hero-title
Não excluir automaticamente.

Permitir que o usuário continue vendo o comentário.

27. EXPORTAÇÃO JSON
Criar um botão extremamente evidente:

⬇ BAIXAR REVISÃO
Ao clicar:

gerar arquivo:

revisao-site-YYYY-MM-DD.json
O arquivo deve conter todas as informações necessárias.

Exemplo:

{
    "reviewVersion": 1,
    "site": "Nome do site",
    "page": "/",
    "url": "https://exemplo.com",
    "exportedAt": "2026-09-14T12:00:00Z",
    "comments": [
        {
            "id": "comment-001",
            "number": 1,
            "element": "#hero-title",
            "tag": "h1",
            "text": "Soluções para sua empresa",
            "path": "body > main > section.hero > h1",
            "comment": "Trocar este título",
            "createdAt": "...",
            "updatedAt": "..."
        }
    ]
}
Utilizar APIs nativas do navegador para gerar o download.

Por exemplo:

Blob
URL.createObjectURL()
Não utilizar biblioteca externa.

28. IMPORTAÇÃO JSON
Criar botão:

⬆ IMPORTAR REVISÃO
Ao clicar:

abrir:

<input type="file" accept=".json">
Depois:

ler arquivo;
validar JSON;
validar reviewVersion;
validar comments;
pedir confirmação se já existirem comentários;
importar;
reconstruir marcações;
localizar elementos.
29. IMPORTAÇÃO SEM PERDER DADOS
Se já houver comentários locais e o usuário importar uma revisão:

mostrar confirmação:

Já existem comentários nesta página.

Deseja substituir os comentários atuais pela revisão importada?

[Cancelar] [Importar]
Não apagar nada sem confirmação.

30. EXPORTAR HTML DE REVISÃO
Criar também:

⬇ EXPORTAR PÁGINA COM REVISÃO
A ideia é gerar um HTML contendo:

a página atual;
o sistema de revisão;
os comentários;
as marcações;
o estado da revisão.
Preferencialmente gerar um HTML autocontido.

Se for tecnicamente possível:

HTML original
+
CSS
+
JavaScript
+
dados da revisão embutidos
O HTML exportado deve poder ser guardado e aberto posteriormente.

31. DIFERENÇA ENTRE JSON E HTML
Existem dois objetivos.

JSON
É o formato oficial de entrega da revisão.

Fluxo:

Cliente faz comentários
        ↓
BAIXAR REVISÃO
        ↓
revisao-site-2026-09-14.json
        ↓
Cliente envia para desenvolvedor
        ↓
Desenvolvedor importa
HTML
É uma cópia visual da revisão para arquivamento ou conferência.

32. AVISO PARA O CLIENTE
Essa é uma das partes MAIS IMPORTANTES.

O cliente precisa entender claramente que deve baixar e enviar o JSON.

Criar dentro do painel de revisão um bloco visualmente destacado:

┌─────────────────────────────────────────────────┐
│                                                 │
│ 📋 NÃO ESQUEÇA DE ENVIAR SUA REVISÃO            │
│                                                 │
│ Quando terminar todos os seus comentários:      │
│                                                 │
│ 1. Clique em "Baixar revisão".                  │
│                                                 │
│ 2. Um arquivo .json será baixado para o         │
│    seu computador.                              │
│                                                 │
│ 3. Envie esse arquivo para nós.                 │
│                                                 │
│ Esse arquivo contém todos os seus comentários   │
│ e marcações.                                    │
│                                                 │
│       [ ⬇ BAIXAR REVISÃO JSON ]                │
│                                                 │
└─────────────────────────────────────────────────┘
Esse bloco deve ser visualmente muito evidente.

Usar uma cor de destaque diferente do restante do painel, sem ficar agressivo.

Texto principal:

"Quando terminar seus comentários, baixe o arquivo de revisão e envie para o desenvolvedor."

Texto auxiliar:

"O arquivo JSON contém todas as marcações feitas nesta página."

33. BOTÃO PRINCIPAL
O botão:

⬇ BAIXAR REVISÃO JSON
deve ser fácil de encontrar.

Pode aparecer:

no painel;
na toolbar;
na área final de revisão.
Mas não criar excesso de botões.

34. CONFIRMAÇÃO DE EXPORTAÇÃO
Depois que o JSON for baixado:

mostrar uma confirmação:

✓ Revisão baixada!

Envie o arquivo "revisao-site-2026-09-14.json"
para o desenvolvedor.
Essa mensagem deve desaparecer depois de alguns segundos, mas pode também existir como status no painel.

35. ESTADO DA REVISÃO
Manter estados:

reviewMode
comments
activeComment
expandedComment
O sistema deve ter uma arquitetura clara.

36. ORGANIZAÇÃO DO JAVASCRIPT
Mesmo estando em um único HTML, organizar o código logicamente.

Preferencialmente criar objetos/classes ou módulos internos:

ReviewManager
CommentManager
ElementResolver
StorageManager
ExportManager
UIManager
ReviewManager
Responsável por:

ativar revisão;
desativar revisão;
controlar estado.
CommentManager
Responsável por:

criar;
editar;
excluir;
renderizar;
expandir;
recolher.
ElementResolver
Responsável por:

identificar elemento;
gerar referência;
encontrar elemento.
StorageManager
Responsável por:

localStorage;
salvar;
carregar;
limpar.
ExportManager
Responsável por:

exportar JSON;
importar JSON;
exportar HTML.
UIManager
Responsável por:

toolbar;
painel;
balões;
mensagens;
modais.
37. NAMESPACE CSS
Todos os estilos do sistema devem possuir namespace.

Exemplo:

.review-tool
.review-tool-toolbar
.review-tool-pin
.review-tool-bubble
.review-tool-panel
.review-tool-highlight
.review-tool-modal
.review-tool-button
Evitar classes genéricas.

Não utilizar:

.modal
.button
.panel
.active
.container
.highlight
Isso é necessário para não interferir no CSS existente.

38. Z-INDEX
Criar uma estratégia clara de z-index.

O sistema deve ficar acima do site quando necessário.

Exemplo conceitual:

review toolbar
review panel
review bubbles
review pins
review highlight
Não usar valores absurdamente altos sem necessidade.

39. SCROLL
Ao fazer scroll:

atualizar posição das bolinhas;
atualizar posição dos balões;
manter comentários associados aos elementos.
Utilizar listeners eficientes.

Se necessário, usar:

requestAnimationFrame()
para evitar excesso de processamento.

40. RESIZE
Ao redimensionar a janela:

recalcular posição;
recalcular balões;
recalcular highlights.
Garantir funcionamento em desktop e mobile.

41. RESPONSIVIDADE
O sistema precisa funcionar em:

desktop;
notebook;
tablet;
celular.
No celular:

balões não podem sair da tela;
painel deve se adaptar;
botões devem ser confortáveis para toque;
textarea deve ser confortável;
bolinhas não devem bloquear conteúdo importante.
42. LINKS E BOTÕES NO MODO REVISÃO
Durante o modo revisão:

modo normal:
clicar botão → executa botão

modo revisão:
clicar botão → cria comentário
Não navegar quando o objetivo for criar comentário.

Usar:

event.preventDefault()
event.stopPropagation()
quando necessário.

Mas somente quando reviewMode === true.

Nunca interferir nos eventos quando o modo revisão estiver desligado.

43. CLIQUE FORA
Se um balão estiver aberto e o usuário clicar em outro elemento:

comportamento preferencial:

salvar automaticamente se for edição já existente;
ou fechar se for apenas visualização;
ao clicar em outro elemento, criar novo comentário somente se o clique for claramente intencional.
Não criar comentários acidentalmente em cliques dentro da própria interface da ferramenta.

IMPORTANTE:

Cliques dentro de:

.review-tool-*
NUNCA devem criar comentários.

44. EXCLUSÃO E CONFIRMAÇÕES
Não excluir comentários silenciosamente.

Sempre pedir confirmação.

45. ACESSIBILIDADE
Utilizar:

aria-label;
botões semânticos;
foco adequado;
textarea acessível;
contraste adequado;
suporte a teclado.
Escape deve fechar:

balão;
modal;
painel.
Se estiver criando comentário novo, Escape deve cancelar.

46. ATALHOS
Se for simples:

R = ativar/desativar modo revisão
Esc = fechar
Não sacrificar estabilidade por atalhos.

47. SEGURANÇA
Comentários são conteúdo fornecido pelo usuário.

Nunca executar HTML ou JavaScript fornecido no comentário.

Preferir:

element.textContent = comment
em vez de:

element.innerHTML = comment
Não permitir XSS através dos comentários.

48. EXEMPLO DE DADOS
Um comentário deve ter aproximadamente:

{
    id: "comment-001",
    number: 1,

    element: "#hero-title",

    tag: "h1",

    text: "Soluções para sua empresa",

    path: "body > main > section.hero > h1",

    comment: "Trocar este título",

    createdAt: "2026-09-14T12:00:00Z",

    updatedAt: "2026-09-14T12:00:00Z"
}
Pode adicionar campos úteis, desde que mantenha a estrutura simples.

49. VERSÃO DO FORMATO
O JSON precisa possuir:

reviewVersion
Começar com:

1
Isso permitirá atualizar o formato no futuro.


