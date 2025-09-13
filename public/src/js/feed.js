var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');

function openCreatePostModal() {
  createPostArea.style.transform = 'translateY(0)';

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((result) => {
      if (result.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added app to home screen');
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Caching in offline state
function onSaveButtonClicked(event) {
  if ('caches' in window) {
    caches.open('user-cache').then((cache) => {
      cahce.add('https://httpbin.org/get');
      cahce.add('/src/images/sf-boat.jpg');
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url(${data.image})`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.backgroundPosition = 'bottom';
  cardWrapper.appendChild(cardTitle);

  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitleTextElement.style.color = '#fff';
  cardTitle.appendChild(cardTitleTextElement);

  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked)
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);

  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  Object.keys(data).forEach((card) => {
    createCard(data[card]);
  })
}

// Strategy: Get data from cache first if exists and then update from the network
var url = 'https://pwagram-be351-default-rtdb.europe-west1.firebasedatabase.app/posts.json';
var networkDataReceived = false;

fetch(url)
  .then((res) => {
    return res.json();
  })
  .then((data) => {
    networkDataReceived = true;
    console.log('Response from web', data);
    updateUI(data);
  });

if ('indexedDB' in window) {
  readAllData(POSTS_STORE).then((data) => {
    if (!networkDataReceived) {
      console.log('Set from indexedDB', data);
      updateUI(data);
    }
  });
}

function sendData() {
  // Make sure that ".write": true inside the Firebase Realtime Database
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: form.title.value,
      location: form.location.value,
      image: 'https://ogletree.com/app/uploads/Locations/Images/WashingtonDC_GettyImages-922906670-scaled.jpg',
    }),
  }).then(() => {
    updateUI();
  });
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (!form.title.value.trim() || !form.location.value.trim()) {
    alert('Please, enter a valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((sw) => {
      var post = {
        id: new Date().toISOString(),
        title: form.title.value,
        location: form.location.value,
      };

      writeData(SYNC_POSTS_STORE, post)
        .then(() => {
          sw.sync.register('sync-new-posts');
        })
        .then(() => {
          const snackbarContainer = document.querySelector('#confirmation-toast');
          const data = {message: 'Your Post has been synced successfully!'};
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
