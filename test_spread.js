try { Object.keys(undefined); } catch (e) { console.log('objkeys', e.message); }
try { [...undefined]; } catch (e) { console.log('spread', e.message); } 
