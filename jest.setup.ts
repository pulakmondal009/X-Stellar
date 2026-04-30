import { TextDecoder, TextEncoder } from "util";
import "@testing-library/react";

(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;
