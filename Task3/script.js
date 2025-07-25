let itemsInCart = 0;
let category = "all";
let curTag = "none";
let currentPage = 1;
let itemsPerPage = 20;
const itemList = document.getElementById("item-list");
const list = document.getElementById("category-list");
const tagList = document.getElementById("tag-list");
const allCtg = document.getElementById("allCtg");
const cart = document.getElementById("cart");
const paginationDiv = document.getElementById("pagination");
allCtg.addEventListener("click", () => {
  category = "all";
  itemList.innerHTML = "";
  currentPage = 1;
  loadItemsFiltered();

  for (let ele of list.children) {
    ele.classList.remove("selected");
  }
  allCtg.classList.add("selected");
});

document.querySelectorAll(".tagDiv").forEach((el) => {
  el.addEventListener("click", (e) => {
    curTag = e.currentTarget.innerText.toLowerCase().trim();
    itemList.innerHTML = "";
    currentPage=1;

    for (let ele of tagList.children) {
      ele.classList.remove("selected");
    }
    e.currentTarget.classList.add("selected");

    loadItemsFiltered();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadItemsFiltered();
});

async function loadCategories() {
  try {
    const res = await fetch("http://43.205.110.71:8000/categories");
    const data = await res.json();

    data.forEach((cat) => {
      const catDiv = document.createElement("div");
      catDiv.textContent = cat.category.toUpperCase();
      catDiv.className = "catDiv";

      catDiv.addEventListener("click", () => {
        category = cat.category.toLowerCase();
        itemList.innerHTML = "";
        currentPage=1;

        for (let ele of list.children) {
          ele.classList.remove("selected");
        }
        catDiv.classList.add("selected");

        loadItemsFiltered();
      });

      list.appendChild(catDiv);
    });
  } catch (err) {
    list.innerHTML = "<li>Error loading categories.</li>";
    console.error(err);
  }
}

async function loadItemsFiltered() {
  itemList.innerHTML="";
  try {
    const res = await fetch("http://43.205.110.71:8000/items");
    const data = await res.json();

    const filteredItems = data.filter((item) => {
      const tags = item.tags.split("|").map((tag) => tag.trim().toLowerCase());

      const matchesCategory =
        category === "all" || item.category.toLowerCase() === category;

      const matchesTag = curTag === "none" || tags.includes(curTag);
      return matchesCategory && matchesTag;
    });
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    paginatedItems.forEach((item) => {
      const div = document.createElement("div");

      div.addEventListener("mouseover", () => {
        div.style.backgroundColor = "#caf1de";
        div.style.border = "2px solid black";
      });
      div.addEventListener("mouseout", () => {
        div.style.backgroundColor = "#e1f8dc";
        div.style.border = "1px solid grey";
      });

      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.justifyContent = "center";
      div.style.backgroundColor = "#e1f8dc";
      div.style.width = "10vw";
      div.style.minWidth = "125px";
      div.style.height = "17vh";
      div.style.border = "1px solid grey";

      div.innerHTML = `
          <h4 style="min-height:15px">${item.name}</h4>
          <p>₹${item.price}</p>
          <button id="btn" class="btn">Add to cart</button>
        `;

      itemList.appendChild(div);
    });

    buttonFn();
    pagination(filteredItems.length);
  } catch (err) {
    itemList.innerHTML = "<li>Error loading items.</li>";
    console.error(err);
  }
}

const buttonFn = function () {
  let btns = document.getElementsByClassName("btn");
  for (let btn of btns) {
    btn.addEventListener("click", () => {
      btn.innerText = "Added To Cart ";
      btn.style.backgroundColor = "green";
      btn.style.color = "white";
      itemsInCart++;
      updateCart();
    });
  }
};
function pagination(noOfItems) {
  
  paginationDiv.innerHTML = "";
  let noOfPages = Math.ceil(noOfItems / itemsPerPage);

  for (let i = 1; i <= noOfPages; i++) {
    let btn = document.createElement("button");
    btn.innerText = i;
    btn.className = i === currentPage ? "activePage" : "";

    btn.addEventListener("click", () => {
      currentPage = i;

      loadItemsFiltered();
    });
    paginationDiv.appendChild(btn);
  }
}
function updateCart() {
  if (itemsInCart == 1) {
    cart.innerHTML = `${itemsInCart} Item in cart`;
  } else {
    cart.innerHTML = `${itemsInCart} Items in cart`;
  }
}
