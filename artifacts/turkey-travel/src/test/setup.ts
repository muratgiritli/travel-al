import '@testing-library/jest-dom';

// jsdom does not implement scrollIntoView — stub it so components that call it
// (e.g. auto-scroll to the latest message) don't throw in tests.
Element.prototype.scrollIntoView = () => {};
