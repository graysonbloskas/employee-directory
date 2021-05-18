let db;
let budgetVersion;

// Request to open BudgetDB in indexedDB, with budgetVersion or 21
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (event) {
  const { oldVersion } = event;
  const newVersion = event.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = event.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = function (event) {
  console.log(`Woops! ${event.target.errorCode}`);
};

function checkDatabase() {

  // New transaction in the BudgetStore
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  // grabs object from BudgetStore
  const budgetStore = transaction.objectStore('BudgetStore');

  // Get all items from the budgetStore
  const getAllItems = budgetStore.getAll();

  // On successful request, and if items are in store, add them back, in bulk, to the db
  getAllItems.onsuccess = function () {
    if (getAllItems.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAllItems.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(['BudgetStore'], 'readwrite');

            const currentStore = transaction.objectStore('BudgetStore');

            // Clears existing store
            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = function (event) {
  db = event.target.result;

  // Check if we are online
  if (navigator.onLine) {
    checkDatabase();
  }
};

// Save item in BudgerStore database
const saveRecord = (item) => {
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  const budgetStore = transaction.objectStore('BudgetStore');

  // Add item to budget store
  budgetStore.add(item);
};

// Event listener for when the user comes back online
window.addEventListener('online', checkDatabase);