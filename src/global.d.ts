export {};

declare global {
  interface DaumPostcodeData {
    zonecode: string;
    roadAddress: string;
    sigungu: string;
    bname: string;
  }

  interface DaumPostcodeConstructor {
    new (options: { oncomplete: (data: DaumPostcodeData) => void }): {
      open: () => void;
    };
  }

  interface Window {
    daum?: {
      Postcode: DaumPostcodeConstructor;
    };
  }
}