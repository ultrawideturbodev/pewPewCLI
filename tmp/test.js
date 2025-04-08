import { ConfigService } from '../dist/modules/config.service.js';

async function test() {
  console.log('Testing getTasksPaths resolution...');
  
  const config = ConfigService.getInstance();
  await config.initialize();
  
  // Test global paths
  const globalPaths = await config.getTasksPaths(true);
  console.log('Global paths:', globalPaths);
  
  // Test default (should fall back to global in this case)
  const defaultPaths = await config.getTasksPaths();
  console.log('Default paths:', defaultPaths);
}

test().catch(error => console.error('Error:', error));
