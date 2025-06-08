import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  tools: {
    rspack: {
      plugins: [!process.env.IS_STORYBOOK && TanStackRouterRspack({
        target: 'react',
        autoCodeSplitting: true
      })]
    }
  }
});
