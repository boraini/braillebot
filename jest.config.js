/** @type {import("jest").Config} */
export default {
    testPathIgnorePatterns: ["./src", "./build", "./node_modules"],
    resolver: "jest-ts-webcompat-resolver",
};
