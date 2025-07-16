import { AccountAbstractionPlugin } from '../accountAbstraction';
import { ethers } from 'ethers';

/**
 * Esempio di utilizzo del plugin Account Abstraction
 */
export class AccountAbstractionExample {
  private plugin: AccountAbstractionPlugin;

  constructor() {
    // Inizializza il plugin con configurazione personalizzata
    this.plugin = new AccountAbstractionPlugin({
      entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint standard
      accountFactoryAddress: "0x0000000000000000000000000000000000000000", // Da configurare
      paymasterAddress: "0x0000000000000000000000000000000000000000", // Opzionale
      bundlerUrl: "https://bundler.example.com" // Opzionale
    });
  }

  /**
   * Esempio di creazione di uno Smart Account
   */
  async createSmartAccountExample(): Promise<void> {
    try {
      console.log("Creando Smart Account...");
      
      // Crea o recupera uno Smart Account per l'indice 0
      const smartAccountAddress = await this.plugin.getOrCreateSmartAccount(0);
      console.log(`Smart Account creato: ${smartAccountAddress}`);

      // Verifica se è effettivamente uno Smart Account
      const isSmartAccount = await this.plugin.isSmartAccount(smartAccountAddress);
      console.log(`È uno Smart Account: ${isSmartAccount}`);

      // Ottieni il saldo
      const balance = await this.plugin.getSmartAccountBalance(smartAccountAddress);
      console.log(`Saldo: ${balance} ETH`);

    } catch (error) {
      console.error("Errore nella creazione del Smart Account:", error);
    }
  }

  /**
   * Esempio di invio di una transazione tramite Smart Account
   */
  async sendTransactionExample(): Promise<void> {
    try {
      console.log("Invio transazione tramite Smart Account...");
      
      const smartAccountAddress = await this.plugin.getOrCreateSmartAccount(0);
      const targetAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Indirizzo destinatario
      const value = "0.001"; // 0.001 ETH
      const data = "0x"; // Nessun dato aggiuntivo

      // Esegui la transazione
      const userOpHash = await this.plugin.executeTransaction(
        smartAccountAddress,
        targetAddress,
        value,
        data
      );

      console.log(`Transazione inviata, UserOperation hash: ${userOpHash}`);

    } catch (error) {
      console.error("Errore nell'invio della transazione:", error);
    }
  }

  /**
   * Esempio di esecuzione di un batch di transazioni
   */
  async executeBatchExample(): Promise<void> {
    try {
      console.log("Esecuzione batch di transazioni...");
      
      const smartAccountAddress = await this.plugin.getOrCreateSmartAccount(0);
      
      // Definisci le transazioni del batch
      const targets = [
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        "0x1234567890123456789012345678901234567890"
      ];
      
      const values = ["0.001", "0.002"]; // Valori in ETH
      const datas = ["0x", "0x"]; // Dati delle transazioni

      // Esegui il batch
      const userOpHash = await this.plugin.executeBatch(
        smartAccountAddress,
        targets,
        values,
        datas
      );

      console.log(`Batch eseguito, UserOperation hash: ${userOpHash}`);

    } catch (error) {
      console.error("Errore nell'esecuzione del batch:", error);
    }
  }

  /**
   * Esempio di configurazione avanzata
   */
  async configureAdvancedExample(): Promise<void> {
    try {
      console.log("Configurazione avanzata...");
      
      // Configura un AccountFactory personalizzato
      this.plugin.setAccountFactory("0x1234567890123456789012345678901234567890");
      
      // Configura un Paymaster
      this.plugin.setPaymaster("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
      
      // Configura un Bundler personalizzato
      this.plugin.setBundler("https://my-bundler.example.com");
      
      // Ottieni la configurazione corrente
      const config = this.plugin.getConfig();
      console.log("Configurazione corrente:", config);

    } catch (error) {
      console.error("Errore nella configurazione:", error);
    }
  }

  /**
   * Esempio completo di utilizzo
   */
  async runCompleteExample(): Promise<void> {
    console.log("=== Esempio completo Account Abstraction ===");
    
    await this.createSmartAccountExample();
    await this.configureAdvancedExample();
    await this.sendTransactionExample();
    await this.executeBatchExample();
    
    console.log("=== Esempio completato ===");
  }
}

// Esempio di utilizzo
export async function runExample(): Promise<void> {
  const example = new AccountAbstractionExample();
  await example.runCompleteExample();
}

// Se eseguito direttamente
if (require.main === module) {
  runExample().catch(console.error);
} 