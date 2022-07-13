interface Plugin {
  name: string;
  data: any;
}

interface Plugins extends Partial<{
  BufferFromFile: any;
}> {
  [key: string]: any;
}

/** Object containing all plugins. */
const Plugins: Plugins = {};
export default Plugins;

/**
 * Registers a plugin. This only has to be called once during the program's
 * lifetime, most often right at the start.
 * 
 * @param plugin Plugin to register
 */
export function registerPlugin(plugin: Plugin) {
  if (!Plugins[plugin.name]) Plugins[plugin.name] = plugin.data;
}
