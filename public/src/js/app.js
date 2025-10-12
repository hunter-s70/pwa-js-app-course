var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => {
      console.log('Service Worker registered');
    })
    .catch((err) => {
      console.error(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  // Using Notifications from Service Worker
  if ('serviceWorker' in navigator) {
    var options = {
      body: 'You successfully subscribed to our Notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-us',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        {
          action: 'confirm',
          title: 'Confirm',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
        {
          action: 'cancel',
          title: 'Cancel',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
      ],
    };

    navigator.serviceWorker.ready
      .then((sw) => {
        sw.showNotification('Successfully subscribed (from SW)!', options)
      });
  }

  // Using Notification API
  // var options = {
  //   body: 'You successfully subscribed to our Notification service!',
  // };
  // new Notification('Successfully subscribed!', options);
}

// Configure push notification subscription
function configurePushSub() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  var reg;
  var url = 'https://pwagram-be351-default-rtdb.europe-west1.firebasedatabase.app/subscriptions.json';
  navigator.serviceWorker.ready
    .then((sw) => {
      reg = sw;
      return sw.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub === null) {
        // Create a new subscription
        var vapidPublicKey = 'BO_XVLjrtdLTdKmo6VZo-ZrivVP3oILH4f13PRAvs5hox2y-RESPPRVGM6Fg5agZbjiSjGWJ6Z8KJJu4OcXM0-8';
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      } else {
        // Use an existing subscription
        // sub.unsubscribe();
      }
    })
    .then((newSub) => {
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(newSub),
      })
    })
    .then((res) => {
      if (res.ok) displayConfirmNotification();
    })
    .catch((err) => {
      console.log(err);
    });
}

function askForNotificationPermission() {
  Notification.requestPermission(function(result) {
    console.log('User choice', result);

    if (result !== 'granted') {
      console.log('No notification permission granted!');
    } else {
      // Handle push notifications
      // displayConfirmNotification();

      // Cloud functions required. Uncompleted
      configurePushSub();
    }
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  // Show notification permission buttons if Notification API supported
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }
}
