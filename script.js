const WHATS_NUMERO = "553199762918";

const produtos = [
  {
    nome:"Jig Urutau",
    cores:[
      {nome:"Verde", img:"img-jigs/urutau.verde.png.jpeg", bg:"#00cc66"},
      {nome:"Preto", img:"img-jigs/urutau.preto.png.jpeg", bg:"#111111"},
      {nome:"Vermelho", img:"img-jigs/urutau-vermelho-png.jpeg", bg:"#e11d2e"}
    ]
  }
];

const grid=document.querySelector("#grid");
const listaCarrinho=document.querySelector("#listaCarrinho");
const finalizar=document.querySelector("#finalizar");
const totalUnidades=document.querySelector("#totalUnidades");

let carrinho=[];

function criarCard(produto){
  const card=document.createElement("article");
  card.className="card";

  let corSelecionada=null;
  let imgSelecionada=null;
  let quantidade=1;

  const img=document.createElement("img");
  img.src=produto.cores[0].img;

  const content=document.createElement("div");
  content.className="content";

  const h2=document.createElement("h2");
  h2.textContent=produto.nome;

  const coresDiv=document.createElement("div");
  coresDiv.className="cores";

  produto.cores.forEach(c=>{
    const chip=document.createElement("div");
    chip.className="cor";
    chip.textContent=c.nome;

    chip.onclick=()=>{
      coresDiv.querySelectorAll(".cor").forEach(el=>{
        el.classList.remove("ativa");
        el.style.background="rgba(255,255,255,.05)";
        el.style.color="#fff";
      });

      chip.classList.add("ativa");
      chip.style.background=c.bg;
      chip.style.color="#000";

      corSelecionada=c.nome;
      imgSelecionada=c.img;
      img.src=c.img;
    };

    coresDiv.appendChild(chip);
  });

  const qtdDiv=document.createElement("div");
  qtdDiv.className="qtd";

  const menos=document.createElement("button");
  menos.textContent="-";

  const numero=document.createElement("span");
  numero.textContent=quantidade;

  const mais=document.createElement("button");
  mais.textContent="+";

  menos.onclick=()=>{ if(quantidade>1){quantidade--;numero.textContent=quantidade;} };
  mais.onclick=()=>{ quantidade++;numero.textContent=quantidade; };

  qtdDiv.append(menos,numero,mais);

  const btnAdd=document.createElement("button");
  btnAdd.className="btn";
  btnAdd.textContent="Adicionar ao Carrinho";

  btnAdd.onclick=()=>{
    if(!corSelecionada) return;

    const existente=carrinho.find(item =>
      item.nome===produto.nome && item.cor===corSelecionada
    );

    if(existente){
      existente.qtd+=quantidade;
    }else{
      carrinho.push({
        nome:produto.nome,
        cor:corSelecionada,
        qtd:quantidade,
        img:imgSelecionada
      });
    }

    atualizarCarrinho();

    quantidade=1;
    numero.textContent=1;
  };

  content.append(h2,coresDiv,qtdDiv,btnAdd);
  card.append(img,content);

  return card;
}

function atualizarCarrinho(){
  listaCarrinho.innerHTML="";
  let total=0;

  carrinho.forEach((item,index)=>{
    total+=item.qtd;

    const div=document.createElement("div");
    div.className="item-carrinho";

    div.innerHTML=`
      <img src="${item.img}">
      <div>
        <strong>${item.nome}</strong><br>
        Cor: ${item.cor}<br>
        Quantidade: ${item.qtd}<br>
        <button class="remover">Remover</button>
      </div>
    `;

    div.querySelector(".remover").onclick=()=>{
      carrinho.splice(index,1);
      atualizarCarrinho();
    };

    listaCarrinho.appendChild(div);
  });

  totalUnidades.textContent=`(${total})`;
  finalizar.textContent=`Finalizar no WhatsApp (${total} itens)`;
  finalizar.disabled=carrinho.length===0;
}

finalizar.onclick=()=>{
  let mensagem="Olá! Gostaria de fazer o seguinte pedido:\n\n";
  carrinho.forEach(item=>{
    mensagem+=`• ${item.qtd} ${item.nome} na cor ${item.cor}\n`;
  });
  const url=`https://wa.me/${WHATS_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  window.open(url,"_blank");
};

produtos.forEach(p=>grid.appendChild(criarCard(p)));