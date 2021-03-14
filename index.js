window.addEventListener('load', (event) => {
    usernameCheck();
    fetchData();
    
    //Set the listener and function for the link submission button.
    const linkSubmitObj = document.getElementById('link-submit-button');
    linkSubmitObj.addEventListener('click', function (event) {
        linkSubmit(event);
    });

    //Set the listener and function for the name submit button.
    const userSubmitObj = document.getElementById('user-submit-button');
    userSubmitObj.addEventListener('click', function (event) {
        usernameSubmit(event);
    });

    //Set the listener and function for the clear name button.
    const clearUsernameButton = document.getElementById('clear-name');
    clearUsernameButton.addEventListener('click', function () {
        clearUsername();
    });

    //Implement a json store for hard coded variables to make it more scalable.
});

function submitItemToJSONBin(link) {
    //straight forward submission, uses a UUID for the postID instead of an iterative value
    //simply because the endpoint is just a json dump and in a real situation there would be handling from the
    //backend so this was a simple solution.
    let links = JSON.parse(localStorage.getItem("links"));
    const username = localStorage.getItem("username");
    const postID = create_UUID();
    links[postID] = {"username": username, "link": link};
    let putreq = putJSONBin(links);
    return putreq;
}

function generateList(items, pagination) {
    //This function generates the list and initiates pagination functions.
    let linksHtml = '';
    const resultsPerPage = 20;
    let keys = Object.keys(items)
    let paginatedKeys = keys.slice((pagination -1) * resultsPerPage, pagination * resultsPerPage);
    //We have to re run the pre/post button with every generateList call in case there is a change to the number
    // of pagination buttons etc.
    generatePagination(keys.length);
    //We have to re run the pre/post button with every pagination page change.
    paginationBinding(pagination);

    let author = '';
    paginatedKeys.forEach((key)=> {
        //For loop to determine who we should declare the author of a link.
        if (items[key]["username"] !== localStorage.getItem("username") && items[key]["username"].length > 15){
            author = 'Anonymous';
        } else if (items[key]["username"] !== localStorage.getItem("username")) {
            author = items[key]["username"];
        } else if (items[key]["username"].length > 10) { 
            author = 'Anonymous(You)';
        } else {
            author = `${items[key]["username"]} (You)`;
        }
        //Creates the html and passes it into a var to then be put into the DOM.
        linksHtml += `<div class="link"> <a href=${items[key]["link"]}>${items[key]["link"]} </a>
        submitted by: ${author} <button onclick="deleteEntry('${key}', '${pagination}')">Delete</button></div>`;
    });
    document.getElementById('links-container').innerHTML = linksHtml;
}

function deleteEntry(key, pagination){
    //Deletes an entry by removing the entry from the currently links directory and PUT the new bundle.
    let links = JSON.parse(localStorage.getItem('links'));
    const resultsPerPage = 20;
    delete links[key];
    let linkString = JSON.stringify(links);
    localStorage.setItem('links', linkString);
    
    //Quick pagination check to see if we need to show a different number of buttons/state than prior.
    const paginationCheck = Math.ceil(Object.keys(links).length/resultsPerPage);
    if (pagination > paginationCheck) {
        pagination = paginationCheck;
    }

    putJSONBin(links);
    generateList(links, pagination);
}

function updateUsername(newUsername){
    //Sets username to their choice and sets in Localstorage to maintain tracking. Updates DOM accordingly.
    localStorage.setItem("username", newUsername);
    document.getElementById('current-username').innerHTML = newUsername;
}

function clearUsername(){
    //Sets username to a generic UUID to maintain tracking, but shows user Anonymous in DOM.
    localStorage.setItem("username", create_UUID());
    document.getElementById('current-username').innerHTML = 'Anonymous';
}


function fetchData() {
    //Runs fetchJSONbin and handles the response.
    let fetchReq = fetchJSONBin();
    const onLoadPagination = 1;
    fetchReq.onreadystatechange = () => {
        if (fetchReq.readyState == XMLHttpRequest.DONE) {

            localStorage.setItem("links", fetchReq.responseText);
            //Passes through the response to the generateList function.
            generateList(JSON.parse(fetchReq.responseText), onLoadPagination);
        }
    };
}

function usernameCheck() {
    //This function checks if we already have a username set in localstorage, else we generate a UUID.
    let username = localStorage.getItem('username');
    if (!username) {
        username = create_UUID();
        localStorage.setItem("username", username);
    }
    //If there already is a UUID, then we just return Anonymous
    document.getElementById('current-username').innerHTML = username.length > 15 ? 'Anonymous': username;

}

function validateLink(link) {
    //Generic simple link validation, if people want to break it they can.
    let regex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/);
    return regex.test(link);
}

function validateUsername(username) {
    //Generic simple username validation for no special characters and less than 15 char.
    if (username !== '' && username.length < 15) {
        let regex = new RegExp(/[!@#$%^&*(),.?":{}|<>]/g);
        return !regex.test(username);
    }
    return false;
}


function fetchJSONBin() {
    //Simple GET request, ideally wouldn't be hard coded but using a json.config.
    let req = new XMLHttpRequest();
    req.open("GET", "https://api.jsonbin.io/b/604c388a7ea6546cf3dc5e5b/latest", true);
    req.send();
    return req;
}

function putJSONBin(json) {
    //Simple PUT request, ideally wouldn't be hard coded but using a json.config.
    json = JSON.stringify(json);
    let req = new XMLHttpRequest();

    req.open("PUT", "https://api.jsonbin.io/b/604c388a7ea6546cf3dc5e5b", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(json);
    return req;
}

function create_UUID(){
    //Generic UUID creation function.
    let dt = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function usernameSubmit(event) {
    //Prevents default action, grabs DOM value for username, validates, and then updates if need be.
    //Otherwise displays an error.
    event.preventDefault();
    let usernameField = document.getElementById('username-input');
    if (validateUsername(usernameField.value)){
        document.getElementById('name-error').style.display = "none";
        const newUsername = document.getElementById('username-input').value;
        updateUsername(newUsername);
        document.getElementById('username-input').value = '';
    }
    else {
        document.getElementById('name-error').style.display = "block";
    }
}

function linkSubmit(event) {
    //Gets link val from DOM, runs validate func, and then submits item. Otherwise displays an error.
    event.preventDefault();
    const link = document.getElementById('link-input').value
    if (validateLink(link)){
        document.getElementById('link-error').style.display = "none";
        let submitReq = submitItemToJSONBin(link);
        submitReq.onreadystatechange = () => {
            if (submitReq.readyState == XMLHttpRequest.DONE) {
            window.location.href = '/results';
            }
        }
    } else {
        document.getElementById('link-error').style.display = "block";
    }
}

function generatePagination(links) {
    //Creates the pagination buttons and sets the initial logic.
    // Note this solution isn't truly scalable as we could have an infinite number of buttons and that
    // would look horrific.
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


function setPaginationRefs() {
    //Sets the onclick handler for the pagination buttons.
    let paginationButtons = document.getElementsByClassName('pagination');
    for (let button of paginationButtons) {
        button.addEventListener('click', function (){
            generateList(JSON.parse(localStorage.getItem('links')), button.dataset.destination);
        });
    };
}

function paginationBinding(pagination) {
    //Binds the pagination buttons to the correct destination.
    let paginationButtons = document.querySelectorAll(('[data-pagination]'));
    if (paginationButtons.length > 1) {
        for (let button of paginationButtons) {
            button.classList.remove("selected");
        }
        let highlightButton = document.querySelector((`[data-pagination='${pagination}']`));
        highlightButton.classList.add("selected");

        //We have to re run the pre/post button with every pagination page change.
        let preButton = document.getElementById("preButton");
        let postButton = document.getElementById("postButton");
        if (pagination > 1) {
            preButton.dataset.destination = parseInt(pagination) -1;
        } else {
            preButton.dataset.destination = parseInt(pagination);
        }
        if (pagination < paginationButtons.length) {
            postButton.dataset.destination = parseInt(pagination) +1;
        } else {
            postButton.dataset.destination = parseInt(pagination);

        }
    }
}