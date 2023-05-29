const maxResults = 100;

async function addRecommendations() {
  const user = await getUser();
  const homepage = document.querySelector(".homepage");

  // `document.querySelector` may return null if the selector doesn't match anything.
  if (homepage) {

    // Popular

    const popular = document.createElement("article");
    const pop_header = document.createElement("h1");
    pop_header.textContent = `Popular (Last 30 days)`;
    const pop_list = document.createElement("u1");
    pop_list.className = "scrollable";

    popular.appendChild(pop_header);
    popular.appendChild(pop_list);

    async function getPopular() {
      const popResponse = await fetch('https://vn-recs.andmore.coffee/api/popular?n=' + maxResults);
      const popJson = await popResponse.json(); //extract JSON from the http response

      id_array = [];
      popJson.forEach(element => {
        id_array.push(element.Id);
      });

      const popTitles = await getTitles(id_array);

      popTitles.forEach((element, index) => {
          vid = element.id;
          popItem = document.createElement("li");
          spanItem = document.createElement("span");

          //Create the score entry
          itemScore = popJson[index].Score;
          scoreSpan = document.createElement("span");
          scoreSpan.textContent = itemScore;
          scoreSpan.style.marginRight = "0.5em";
          scoreSpan.style.marginLeft = "0.5em";

          // Create the link
          itemLink = document.createElement("a");
          itemLink.textContent = element.title;
          itemLink.href = "/" + vid;

          // Append the list
          spanItem.appendChild(scoreSpan);
          spanItem.appendChild(itemLink);
          popItem.appendChild(spanItem);
          pop_list.appendChild(popItem)
      });
    }

    getPopular();

    homepage.appendChild(popular);

    // Recommended for me

    const recs = document.createElement("article");
    const rec_header = document.createElement("h1");
    rec_header.textContent = `Recommended For You`;
    const rec_list = document.createElement("u1");
    rec_list.className = "scrollable";

    recs.appendChild(rec_header);
    recs.appendChild(rec_list);

    async function getRecs() {
      const popResponse = await fetch('https://vn-recs.andmore.coffee/api/recommend/' + user + '?n=' + maxResults);
      const popJson = await popResponse.json(); //extract JSON from the http response
      const popTitles = await getTitles(popJson);
      popTitles.forEach(element => {
          vid = element.id;
          popItem = document.createElement("li");
          spanItem = document.createElement("span");

          // Create the link
          itemLink = document.createElement("a");
          itemLink.textContent = element.title;
          itemLink.href = "/" + vid;


          // Append the list
          spanItem.appendChild(getDNRButton(vid, user, popItem));
          spanItem.appendChild(itemLink);
          popItem.appendChild(spanItem);
          rec_list.appendChild(popItem)
      });
    }

    getRecs();

    homepage.appendChild(recs);

    // More like

    const morelike = document.createElement("article");
    const morelike_header = document.createElement("h1");
    const morelike_list = document.createElement("u1");
    morelike_list.className = "scrollable";

    morelike.appendChild(morelike_header);
    morelike.appendChild(morelike_list);

    async function getMoreLike() {

      data = {
        "user": "u" + user,
        "fields": "id, vn.title, vote",
        "filters": [ "label", "=", 7 ],
        "sort": "vote",
        "reverse": true,
        "results": 10
      };

      payload = JSON.stringify(data);

      const response = await fetch('https://api.vndb.org/kana/ulist', {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-type': 'application/json'
        },
        body: payload
      });

      const titles = await response.json();
      const randVN = titles.results[Math.floor(Math.random() * titles.results.length)]
      const randVNId = randVN.id.slice(1);
      const randVNtitle = randVN.vn.title;
      morelike_header.textContent = randVNtitle + ` Readers Liked`;

      const popResponse = await fetch('https://vn-recs.andmore.coffee/api/item/' + randVNId + '/neighbors?n=' + maxResults);
      const popJson = await popResponse.json(); //extract JSON from the http response
      
      id_array = [];
      popJson.forEach(element => {
        id_array.push(element.Id);
      });

      const popTitles = await getTitles(id_array);

      popTitles.forEach((element, index) => {
        vid = element.id;
        popItem = document.createElement("li");
        spanItem = document.createElement("span");

        //Create the score entry
        itemScore = popJson[index].Score * 100;
        itemScore = itemScore.toFixed(1);
        scoreSpan = document.createElement("span");
        scoreSpan.textContent = itemScore;
        scoreSpan.style.marginRight = "0.5em";
        scoreSpan.style.marginLeft = "0.5em";
        
        // Create the link
        itemLink = document.createElement("a");
        itemLink.textContent = element.title;
        itemLink.href = "/" + vid;


        // Append the list
        spanItem.appendChild(scoreSpan);
        spanItem.appendChild(itemLink);
        popItem.appendChild(spanItem);
        morelike_list.appendChild(popItem)
      });
    }

    getMoreLike();

    homepage.appendChild(morelike);

  }
}

async function getTitles(id_array) {
  filter = ["or"];
  id_array.forEach(element => {
    id_filter = ["id", "=", element]
    filter.push(id_filter)
  });

  data = {
    "fields": "title",
    "filters": filter,
    "results": maxResults
  };

  payload = JSON.stringify(data);

  const response = await fetch('https://api.vndb.org/kana/vn', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: payload
  });

  const titles = await response.json();
  const title_results = titles.results.sort(function(a,b) {
    return id_array.indexOf(a.id.slice(1)) - id_array.indexOf(b.id.slice(1));
  });
  return title_results;
}

function getDNRButton(vid, user, parent) {
  // Create the button
  itemButton = document.createElement("span");
  itemButton.title = `Do not recommend this title`;
  buttonIcon = document.createElement("i");
  buttonIcon.className = "fa-regular fa-circle-xmark";
  buttonIcon.style.color = "#c00";
  buttonIcon.style.cursor = "pointer";
  buttonIcon.style.marginRight = "0.5em";
  buttonIcon.style.marginLeft = "0.5em";
  itemButton.appendChild(buttonIcon);

  const newDate = new Date().toString();
  const data = [{
    "Comment": "Do not want recommendation",
    "FeedbackType": "do-not-recommend",
    "ItemId": vid.slice(1),
    "Timestamp": newDate,
    "UserId": user
  }];
  const strData = JSON.stringify(data);  

  itemButton.addEventListener('click', async _ => {
    try { 
      const response = await fetch('https://vn-recs.andmore.coffee/api/feedback/', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json'
        },
        body: strData
      });
      parent.remove();
    } catch(err) {
      console.error(`Error: ${err}`);
    }
  });

  return itemButton;
}

async function getUser() {
  
  const response = await fetch('https://api.vndb.org/kana/authinfo', {
    method: 'GET',
    credentials: "include"
  });
  
  const authinfo = await response.json();
  return authinfo.id.slice(1);
}

addRecommendations();