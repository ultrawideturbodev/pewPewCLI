/**
 * ConfigService
 * 
 * Manages loading and saving YAML configurations.
 * Handles configuration keys, values, and scopes (local vs global).
 */
export class ConfigService {
  // Properties
  private localConfigDir: string;
  private globalConfigDir: string;
  private settings: Record<string, any>;
  private paths: Record<string, any>;
  private secrets: Record<string, any>;
  private aliases: Record<string, any>;
  private prompts: Record<string, any>;

  constructor() {
    this.localConfigDir = '';
    this.globalConfigDir = '';
    this.settings = {};
    this.paths = {};
    this.secrets = {};
    this.aliases = {};
    this.prompts = {};
  }
} 