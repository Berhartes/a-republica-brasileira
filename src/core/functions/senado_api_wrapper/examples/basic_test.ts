// A simple test for the basic functionality
import { SenadoApiWrapper } from '../src';

async function testBasic() {
  console.log("Testing basic wrapper functionality");
  
  try {
    const senadoApi = new SenadoApiWrapper();
    console.log("SenadoApiWrapper initialized successfully");
    
    // Try a simple API call
    console.log("Fetching party list...");
    const partidos = await senadoApi.composicao.listarPartidos();
    console.log(`Found ${partidos.length} parties`);
    
    if (partidos.length > 0) {
      console.log("Sample party data:");
      console.log(partidos[0]);
    }
    
    console.log("Test completed successfully");
  } catch (error) {
    console.error("Error during test:", error);
  }
}

testBasic();
