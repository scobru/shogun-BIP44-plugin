// Test script per verificare la sincronizzazione della mnemonic
// Questo script può essere eseguito nella console del browser per testare la sincronizzazione

async function testMnemonicSync() {
  console.log("🧪 Test di sincronizzazione mnemonic...");
  
  try {
    // Assicurati che Shogun sia inizializzato
    if (!window.shogun || !window.shogun.hdwallet) {
      console.error("❌ Plugin HDWallet non disponibile");
      return;
    }

    const hdwallet = window.shogun.hdwallet;
    
    // 1. Controlla lo stato iniziale
    console.log("📊 Controllo stato iniziale...");
    const initialStatus = await hdwallet.getMnemonicStatus();
    console.log("Stato iniziale:", initialStatus);
    
    // 2. Prova a recuperare la mnemonic
    console.log("🔍 Recupero mnemonic...");
    const mnemonic = await hdwallet.getUserMasterMnemonic();
    if (mnemonic) {
      console.log("✅ Mnemonic trovata:", mnemonic.substring(0, 20) + "...");
    } else {
      console.log("❌ Nessuna mnemonic trovata");
    }
    
    // 3. Forza sincronizzazione
    console.log("🔄 Forzatura sincronizzazione...");
    const syncResult = await hdwallet.forceMnemonicSync();
    console.log("Risultato sincronizzazione:", syncResult);
    
    // 4. Controlla lo stato finale
    console.log("📊 Controllo stato finale...");
    const finalStatus = await hdwallet.getMnemonicStatus();
    console.log("Stato finale:", finalStatus);
    
    // 5. Prova a creare un wallet per verificare che tutto funzioni
    if (mnemonic) {
      console.log("💰 Creazione wallet di test...");
      try {
        const wallet = await hdwallet.createWallet();
        console.log("✅ Wallet creato:", wallet.address);
      } catch (error) {
        console.error("❌ Errore creazione wallet:", error);
      }
    }
    
    console.log("✅ Test completato!");
    
  } catch (error) {
    console.error("❌ Errore durante il test:", error);
  }
}

// Funzione per pulire localStorage e testare il recupero da GunDB
async function testLocalStorageReset() {
  console.log("🧹 Test reset localStorage...");
  
  try {
    // 1. Salva lo stato prima del reset
    const hdwallet = window.shogun.hdwallet;
    const beforeStatus = await hdwallet.getMnemonicStatus();
    console.log("Stato prima del reset:", beforeStatus);
    
    // 2. Pulisci localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('shogun_master_mnemonic')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log("🗑️ Rimosso:", key);
    });
    
    // 3. Verifica che la mnemonic sia ancora recuperabile
    console.log("🔍 Verifica recupero dopo reset...");
    const mnemonic = await hdwallet.getUserMasterMnemonic();
    if (mnemonic) {
      console.log("✅ Mnemonic recuperata dopo reset:", mnemonic.substring(0, 20) + "...");
    } else {
      console.log("❌ Mnemonic non recuperabile dopo reset");
    }
    
    // 4. Forza sincronizzazione per ripristinare localStorage
    console.log("🔄 Ripristino localStorage...");
    const syncResult = await hdwallet.forceMnemonicSync();
    console.log("Risultato ripristino:", syncResult);
    
    // 5. Verifica stato finale
    const afterStatus = await hdwallet.getMnemonicStatus();
    console.log("Stato dopo ripristino:", afterStatus);
    
    console.log("✅ Test reset completato!");
    
  } catch (error) {
    console.error("❌ Errore durante il test reset:", error);
  }
}

// Esporta le funzioni per l'uso nella console
window.testMnemonicSync = testMnemonicSync;
window.testLocalStorageReset = testLocalStorageReset;

console.log("🧪 Script di test caricato!");
console.log("Usa testMnemonicSync() per testare la sincronizzazione");
console.log("Usa testLocalStorageReset() per testare il reset del localStorage"); 