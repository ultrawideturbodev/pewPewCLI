#!/usr/bin/env node

// bin/pew.js - This JS file runs the compiled TS code
       
// Dynamically import the compiled entry point from dist
import('../dist/index.js') 
  .catch(err => {
    console.error("Failed to load the CLI application:", err);
    process.exit(1);
  }); 