// Esporta solo i tipi da types.ts
export type {
  HDWalletPluginInterface,
  WalletInfo,
  WalletPath,
  BalanceCache,
  WalletExport,
  WalletConfig,
  TransactionOptions,
  WalletBackupOptions,
  WalletImportOptions,
  WalletEventType,
  WalletEvent,
  BaseEvent,
  BaseConfig,
  BaseCacheEntry,
  BaseBackupOptions,
  BaseImportOptions,
} from "./types";

// Esporta le classi dai file specifici
export { HDWalletPlugin } from "./hdwalletPlugin";
export { HDWallet } from "./hdwallet";
export { BasePlugin } from "./base";
export { AccountAbstractionPlugin } from "./accountAbstraction";

// Esporta i tipi di Account Abstraction
export type {
  UserOperation,
  UserOperationOptions,
  SmartAccountConfig,
} from "./accountAbstraction";

// Esporta le utility
export {
  log,
  logError,
  logWarn,
  EventEmitter,
  ErrorType,
  ErrorHandler,
} from "./utils";
