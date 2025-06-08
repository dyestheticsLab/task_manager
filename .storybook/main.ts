import type { StorybookConfig } from 'storybook-react-rsbuild';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-onboarding"
  ],
  "framework": {
    "name": "storybook-react-rsbuild",
    "options": {}
  }
};
export default config;