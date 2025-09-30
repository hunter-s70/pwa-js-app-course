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
  var options = {
    body: 'You successfully subscribed to our Notification service!',
  };
  new Notification('Successfully subscribed!', options);
}

function askForNotificationPermission() {
  Notification.requestPermission(function(result) {
    console.log('User choice', result);

    if (result !== 'granted') {
      console.log('No notification permission granted!');
    } else {
      // Handle push notifications
      displayConfirmNotification();
    }
  });
}

if ('Notification' in window) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }
}
