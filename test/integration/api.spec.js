const expect   = require('chai').expect;

const App      = require('./app');
const Simulator = require('./simulate');


describe('API-TEST', () => {

    let server = null;
    let simulator = null;

    let config = { 
        uploader : '/upload'
        , base_path : './uploader/'
    };
        
    before(async () => { 
        
        const app = App(config);
        server = app;

        simulator = Simulator(server, config.uploader);

    });    

    after( ()=> {/*server.close();*/} );
    
    
    it('check broken end', async () => {
       
        let res = await simulator.broken_start();
            
        
        expect(res.status).to.be.above(199, 'broken end');
        //expect(res.body.length).to.be.above(1);

        
       
    });

    it('check invalid size', async () => {
       
        let res = await simulator.invalid_size();
        
        expect(res.status).to.be.above(399, 'invalid size');
       
    });

});
