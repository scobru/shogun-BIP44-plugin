import { HDWallet } from './hdwallet';
import { ethers } from 'ethers';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });


// Mock Gun.js
const mockGunPut = jest.fn((data, cb) => cb && cb({ err: null, ok: true }));

const mockMasterMnemonic = {
  put: mockGunPut,
  once: jest.fn((cb) => cb(null)),
};

const mockShogun = {
  get: jest.fn((key) => {
    if (key === 'master_mnemonic') {
      return mockMasterMnemonic;
    }
    if(key === 'wallet_paths') {
      return {
        once: jest.fn(),
        put: mockGunPut
      }
    }
    return undefined;
  }),
};

const mockGunUser = {
  get: jest.fn((key) => {
    if (key === 'shogun') {
      return mockShogun;
    }
    return undefined;
  }),
  put: mockGunPut,
  once: jest.fn(),
  is: {
    alias: 'testuser',
    pub: 'testpubkey'
  },
  _: {
    sea: {
      priv: 'testprivkey',
      pub: 'testpubkey'
    }
  },
  auth: jest.fn((pair, cb) => cb && cb({ err: null, ok: true })),
  recall: jest.fn().mockReturnThis(),
};

const mockGun = {
  user: jest.fn(() => mockGunUser),
};

// Mock SEA
jest.mock('shogun-core', () => ({
  SEA: {
    encrypt: jest.fn((data, secret) => Promise.resolve(`encrypted:${data}`)),
    decrypt: jest.fn((data, secret) => {
      if (typeof data === 'string' && data.startsWith('encrypted:')) {
        return Promise.resolve(data.substring(10));
      }
      return Promise.resolve(data);
    }),
  },
}));


describe('HDWallet', () => {
  let hdWallet: HDWallet;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    hdWallet = new HDWallet(mockGun);
  });

  it('should be defined', () => {
    expect(hdWallet).toBeDefined();
  });

  describe('saveUserMasterMnemonic', () => {
    it('should save a valid mnemonic', async () => {
      const mnemonic = hdWallet.generateNewMnemonic();
      await hdWallet.saveUserMasterMnemonic(mnemonic);
      // We expect put to have been called on the user's graph
      expect(mockGunUser.get).toHaveBeenCalledWith('shogun');
      expect(mockShogun.get).toHaveBeenCalledWith('master_mnemonic');
      expect(mockGunPut).toHaveBeenCalled();
    });

    it('should throw an error for an invalid mnemonic', async () => {
      const invalidMnemonic = 'this is not a valid mnemonic';
      await expect(hdWallet.saveUserMasterMnemonic(invalidMnemonic)).rejects.toThrow('Invalid mnemonic length');
    });
  });

  describe('generatePrivateKeyFromString', () => {
    it('should generate a valid private key from a string', () => {
      const input = 'test seed';
      const privateKey = (hdWallet as any).generatePrivateKeyFromString(input);
      expect(privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(privateKey).toBe(ethers.sha256(new TextEncoder().encode(input)));
    });
  });

  describe('Mnemonic generation', () => {
    it('should generate a new mnemonic', () => {
      const mnemonic = hdWallet.generateNewMnemonic();
      expect(mnemonic.split(' ').length).toBe(12);
    });
  });
});
