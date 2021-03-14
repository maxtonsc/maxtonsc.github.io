window.addEventListener('load', (event) => {
    //Only need the fetch data since we dont have to set up listeners, the home button is simple
    // enough to be just html.
    fetchData();
});

function generateList(items, pagination) {
    //This is different from index.js in that we need to show discretion about what links we show.
    let linksHtml = '';
    const resultsPerPage = 20;
    let keys = Object.keys(items);
    const username = localStorage.getItem("username");
    const author = username && username.length < 15 ? username : 'Anonymous';
    //Generating a new obj containing filtered results for easier pagination etc.
    let filteredObjects = {};
    keys.forEach((key)=> {
        if (items[key]["username"] === username){
            filteredObjects[key] = items[key]; 
        }
    });
    let filteredKeys = Object.keys(filteredObjects);
    //Stores the result for other functions in results.js to access easily without the use of a global var.
    localStorage.setItem('links', JSON.stringify(filteredObjects));

    let paginatedFilteredKeys = filteredKeys.slice((pagination -1) * resultsPerPage, pagination * resultsPerPage);

    paginatedFilteredKeys.forEach((key)=> {
        linksHtml += `<div class="link"> <a href=${filteredObjects[key]["link"]}>${filteredObjects[key]["link"]} </a>
        submitted by: ${author}(You) <button onclick="deleteEntry('${key}','${pagination}')">Delete</button></div>`;
        });
    generatePagination(filteredKeys.length);
    paginationBinding(pagination);
    if (linksHtml === '') {
        document.getElementById('page-title').innerHTML = 'You have yet to submit!';
    }
    document.getElementById('links-container').innerHTML = linksHtml;
}

//Not unique to results, see index.js commenting if required.
function deleteEntry(key, pagination){
    let links = JSON.parse(localStorage.getItem('links'));
    const resultsPerPage = 20;
    delete links[key];
    const paginationCheck = Math.ceil(Object.keys(links).length/resultsPerPage);
    if (pagination > paginationCheck) {
        pagination = paginationCheck;
    }

    let linkString = JSON.stringify(links);
    localStorage.setItem('links', linkString);
    putJSONBin(links);
    generateList(links, pagination);
}

//Not unique to results, see index.js commenting if required.
function fetchData() {
    let fetchReq = fetchJSONBin();
    const onLoadPagination = 1;
    fetchReq.onreadystatechange = () => {
        if (fetchReq.readyState == XMLHttpRequest.DONE) {
            const parsedRes = JSON.parse(fetchReq.responseText)
            localStorage.setItem("links", fetchReq.responseText);
            generateList(parsedRes, onLoadPagination);
        }
    };
}

//Not unique to results, see index.js commenting if required.
function fetchJSONBin() {
    let req = new XMLHttpRequest();
    req.open("GET", "https://api.jsonbin.io/b/604c388a7ea6546cf3dc5e5b/latest", true);
    req.send();
    return req;
}

//Not unique to results, see index.js commenting if required.
function putJSONBin(json) {
    json = JSON.stringify(json);
    let req = new XMLHttpRequest();
    req.open("PUT", "https://api.jsonbin.io/b/604c388a7ea6546cf3dc5e5b", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(json);
    return req;
}

//Not unique to results, see index.js commenting if required.
function generatePagination(links) {
    let paginationContainer = document.getElementById('pagination-container')
    const pageCount = Math.ceil(links/20)
    if (pageCount < 2){
        paginationContainer.innerHTML = '';
        return;
    }
    paginationContainer.innerHTML = '<button id="preButton" class="pagination" data-destination="1" > < </button>'
    for (let i = 1; i < pageCount+1; i++) {
        paginationContainer.innerHTML += '<button class="pagination" data-destination="' + i +
         '" data-pagination="' + i + '">' + i + '</button>';
    }
    paginationContainer.innerHTML += '<button id="postButton" class="pagination" data-destination="2"> > </button>'

    setPaginationRefs();
}

//Not unique to results, see index.js commenting if required.
function setPaginationRefs() {
    let paginationButtons = document.getElementsByClassName('pagination');
    for (let button of paginationButtons) {
        button.addEventListener('click', function (){
            generateList(JSON.parse(localStorage.getItem('links')), button.dataset.destination);
        });
    };
}

//Not unique to results, see index.js commenting if required.
function paginationBinding(pagination) {
    let paginationButtons = document.querySelectorAll(('[data-pagination]'));
    if (paginationButtons.length > 1) {
        for (let button of paginationButtons) {
            button.classList.remove("selected");
        }
        let highlightButton = document.querySelector((`[data-pagination='${pagination}']`));
        highlightButton.classList.add("selected");
    
    
        if (pagination > 1) {
            let preButton = document.getElementById("preButton");
            preButton.dataset.destination = parseInt(pagination) -1;
        }
        if (pagination < paginationButtons.length) {
            let postButton = document.getElementById("postButton");
            postButton.dataset.destination = parseInt(pagination) +1;
        }
    }
}