# Sincronizzazione Mnemonic - HDWallet Plugin

## Problema Risolto

Il problema originale era che quando il localStorage veniva resettato, il sistema non riusciva a recuperare correttamente la mnemonic da GunDB, causando la generazione di nuovi wallet invece di riutilizzare quelli esistenti.

## Soluzione Implementata

### 1. Miglioramento del Recupero Mnemonic

Il metodo `getUserMasterMnemonic()` è stato migliorato con:

- **Logging dettagliato**: Per tracciare ogni passo del processo di recupero
- **Gestione errori robusta**: Per gestire fallimenti di decrittografia
- **Sincronizzazione automatica**: Quando una mnemonic viene recuperata da una fonte, viene automaticamente sincronizzata all'altra

### 2. Nuovi Metodi di Sincronizzazione

#### `forceMnemonicSync()`

Forza la sincronizzazione della mnemonic tra GunDB e localStorage.

```typescript
const success = await hdwallet.forceMnemonicSync();
if (success) {
  console.log("Sincronizzazione completata con successo");
}
```

#### `getMnemonicStatus()`

Controlla dove è memorizzata la mnemonic.

```typescript
const status = await hdwallet.getMnemonicStatus();
console.log("Stato mnemonic:", status);
// Output: { hasGunDB: true, hasLocalStorage: false, isSynced: false }
```

### 3. Metodi Privati di Supporto

- `syncMnemonicToLocalStorage()`: Sincronizza da GunDB a localStorage
- `syncMnemonicToGunDB()`: Sincronizza da localStorage a GunDB

## Come Utilizzare

### Test della Sincronizzazione

1. **Carica lo script di test** nella console del browser:

```javascript
// Copia e incolla il contenuto di test-sync.js nella console
```

2. **Esegui il test di sincronizzazione**:

```javascript
await testMnemonicSync();
```

3. **Testa il reset del localStorage**:

```javascript
await testLocalStorageReset();
```

### Utilizzo Programmato

```typescript
// Ottieni il plugin HDWallet
const hdwallet = shogun.hdwallet;

// Controlla lo stato della mnemonic
const status = await hdwallet.getMnemonicStatus();
console.log("Stato mnemonic:", status);

// Se non sincronizzata, forza la sincronizzazione
if (!status.isSynced) {
  const success = await hdwallet.forceMnemonicSync();
  if (success) {
    console.log("Mnemonic sincronizzata con successo");
  }
}

// Recupera la mnemonic
const mnemonic = await hdwallet.getUserMasterMnemonic();
if (mnemonic) {
  console.log("Mnemonic disponibile");
}
```

## Flusso di Recupero Migliorato

1. **Controllo GunDB**: Il sistema cerca prima la mnemonic in GunDB
2. **Decrittografia**: Se trovata, tenta di decrittografarla
3. **Sincronizzazione automatica**: Se decrittografata con successo, la sincronizza a localStorage
4. **Fallback localStorage**: Se non trovata in GunDB, cerca in localStorage
5. **Sincronizzazione inversa**: Se trovata in localStorage, la sincronizza a GunDB
6. **Gestione errori**: Se entrambi falliscono, restituisce null

## Logging Migliorato

Il sistema ora fornisce log dettagliati per:

- Tentativi di recupero da GunDB
- Processo di decrittografia
- Sincronizzazione tra fonti
- Errori e fallimenti
- Stato della mnemonic

## Esempio di Output dei Log

```
[BIP44] Attempting to retrieve mnemonic from GunDB for user: 0xa6591dcdff5c
[BIP44] Data received from GunDB: string has data
[BIP44] Mnemonic retrieved from GunDB
[BIP44] gunMnemonic type: string
[BIP44] gunMnemonic length: 156
[BIP44] Attempting to decrypt GunDB mnemonic...
[BIP44] Successfully decrypted mnemonic from GunDB
[BIP44] Mnemonic synced to localStorage as backup
```

## Risoluzione Problemi

### Se la mnemonic non viene recuperata:

1. **Controlla lo stato**:

```javascript
await hdwallet.getMnemonicStatus();
```

2. **Forza la sincronizzazione**:

```javascript
await hdwallet.forceMnemonicSync();
```

3. **Verifica l'autenticazione**:

```javascript
// Assicurati che l'utente sia autenticato
if (shogun.isLoggedIn()) {
  console.log("Utente autenticato");
}
```

### Se il localStorage è vuoto:

Il sistema dovrebbe automaticamente recuperare la mnemonic da GunDB e sincronizzarla al localStorage. Se questo non funziona, usa:

```javascript
await hdwallet.forceMnemonicSync();
```

## Compatibilità

- ✅ Funziona con localStorage vuoto
- ✅ Sincronizzazione bidirezionale
- ✅ Gestione errori robusta
- ✅ Logging dettagliato
- ✅ Compatibile con il sistema di crittografia esistente
