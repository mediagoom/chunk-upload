//const webdriver = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const firefox = require('selenium-webdriver/firefox');
const SauceLabs = require('saucelabs');
const dbg = require('debug')('selenium:e2e');
const assert       = require('assert');//.strict;
const file_detector = require('selenium-webdriver/remote').FileDetector;

const EventEmitter = require('events');

let _version = '0.0.3';

function isSouceLab()
{
    const url = process.env.SELENIUM_REMOTE_URL;//builder.getServerUrl();
    const rx  = /saucelab/i.test(url);

    dbg('isSouceLab', url, rx);

    if(url)
        if(rx)
            return true;

    return false;
}


async function report(session, title, sauce, status)
{
    dbg('report', session, title, sauce, status);

    return new Promise( (resolve, reject) => {

        
        
        if(!status)
        {
            console.log('Failed\t', title);
        }

        if(isSouceLab() && sauce)
        {       
            dbg('sauce-report', session.getId(), title, status); 
            sauce.updateJob(session.getId(), {
                name: title
                ,build: _version
                ,passed: status
            }, function(err, res)
            {
                        
                if(err)
                {
                    dbg('sauce-report-failed', err);
                    reject(err);
                }
                else
                    resolve(res);
            }
            );
        }
        else
        {
            dbg('not-sauce-report', session.getId(), title, status);
            resolve(null);
        }
        
    });
    
}


function get_title(/*caps, id)
{
    let title =  `${caps.get('browserName')}-${(caps.get('browserVersion'))?caps.get('browserVersion'):caps.get('version')}-${(null ==caps.get('platform'))?caps.get('platformName'):caps.get('platform')}`;

    dbg('title', title);
    */){

    return 'selenium-chunk-upload';
}



async function main(target_browser) {

    dbg('starting up');
  
    let driver = null;
    let sauce = null;
    
    let builder = null;
    let session = null;
    let title = null;

    let options = new firefox.Options()
        .setPreference('devtools.chrome.enabled', true)
        .setPreference('devtools.debugger.remote-enabled', true)
        .setPreference('devtools.debugger.prompt-connection', false);

    let use_firefox_options = false;

    try 
    {

        let browserName = 'chrome';

        if(undefined !== target_browser)
            browserName = target_browser;

        builder = new Builder();

        if(process.env.SELENIUM_REMOTE_URL)
        { 
            if(process.env.http_proxy)
            {
                dbg('setting proxy:', process.env.http_proxy);
                builder.usingWebDriverProxy(process.env.http_proxy);
            }

            if(process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY)
            {
                dbg('username:', process.env.SAUCE_USERNAME);
            
                /*
            builder.withCapabilities({
                'username': process.env.SAUCE_USERNAME,
                'accessKey': process.env.SAUCE_ACCESS_KEY
              }
            );
            */

                if(process.env.SAUCE_SELENIUM_BROWSER)
                {
                    let browser = process.env.SAUCE_SELENIUM_BROWSER.split(/:/, 3);
                    browserName =  browser[0];

                    console.log('Testing\t', browser);

                    builder.withCapabilities({
                        'browserName': browser[0]
                        , 'version': browser[1]
                        , 'platform' : browser[2]
                        , 'screenResolution' : '1024x768'
                        , 'extendedDebugging' : true
                        , 'moz:firefoxOptions': {
                            'args': [
                                '-start-debugger-server'
                                ,'9222'
                            ]
                        }
                    }
                    );

                    if('firefox' == browser)
                    {
                        use_firefox_options = true;
                    }
                

                }
                
                sauce = new SauceLabs({
                    username: process.env.SAUCE_USERNAME
                    ,password: process.env.SAUCE_ACCESS_KEY
                    ,proxy: process.env.http_proxy
                });

                //sdbg("souce", sauce);
            }
        }

        builder.setEdgeService(new edge.ServiceBuilder());

        if(use_firefox_options)
        {
            driver = await builder.forBrowser(browserName).setFirefoxOptions(options).build();
        }else
        {
            driver = await builder.forBrowser(browserName).build();
        }
    

        const caps = await driver.getCapabilities();

        dbg('driver capabilities', caps);

        /*
    if(caps.has('browserVersion'))
    {
        const version = caps.get('browserVersion');
        caps.delete('browserVersion');
        caps.set('version', version);
        dbg('resetting version', version);
    }
    */

        session = await driver.getSession();

        dbg('loaded driver..', session.getId(), session.getCapabilities());

        title = get_title(session.getCapabilities(), session.getId());

        return driver;
      
        /*
    
        const links = await thelinks(driver);
    
        dbg('found links', links.length);

        let list = [];
        let ns = [];

        for(let idx = 0; idx < links.length; idx++)
        {
            const txt = await links[idx].getText();
            const href = await links[idx].getAttribute('href');
            dbg('found link :', txt, href);
            const rx = /local/ig;
            if(!rx.test(txt))
            {
                dbg('push ', href);
                list.push(href);
                ns.push(idx);
            }
        }

        let time = 0;

        for(let idx = 0; idx < list.length; idx++)
        {
            time = await test_player_page(driver, list[idx], ns[idx]);

            if(0 >= time)
            {
            //title = `[${idx}]-${title}`;
                break;
            }
        }

        if(0 < time)
        {
            await report(session, title, sauce, true);
            process.exitCode = 0;
        }
        else
        {
            await report(session, title, sauce, false);
            process.exitCode = 1;
        }


    /*
    await icon[idx].click();

    await driver.wait(until.elementLocated(By.id('player')), 5000);

    let player = await driver.findElements(By.id('player'));

    const url = await driver.getCurrentUrl();

    console.log(url);    

    let time = await get_time(driver, player);

    console.log('time1', time);

    await driver.sleep(10000);

    time = await get_time(driver, player);

    console.log('time2', time);
    */
    } 
    catch(e)
    {
        process.exitCode = 3;
        console.log('ERROR: ', e);
        await report(session, /*"ERROR-" +*/ title, sauce, false);
      
    }
    /*finally 
    {
        if(driver)
            await driver.quit();
    }
    */
}

 
/**
 * Selenium web driver testing facilitator
 */
class selenium extends EventEmitter 
{
    constructor()
    {
        super();

        this.driver = undefined;
        this.element = undefined;
        
    }

    async start(target_browser)
    {
        this.driver = await main(target_browser);

        //this.driver.setFileDetector(new file_detector());
    }

    async close()
    {
        if(undefined !== this.driver)
            await this.driver.quit();
    }

    /**
     * @param {tring} url the url to navigate to 
     * @param {string} xpath the xpath expression to wait for. for instance '//div[@id="player"]/ul/li/a'
     * @param {number} timeout_ms ms timeout. Default 5000. 
     */
    async get(url, xpath, timeout_ms)
    {
        assert(undefined !== this.driver);

        if(undefined === timeout_ms)
            timeout_ms = 5000;

        dbg('loading ', url);

        await this.driver.get(url);

        await this.driver.wait(until.elementLocated(By.xpath(xpath)), timeout_ms);
    }

    /**
     * Select the current element by id
     * @param {string} id 
     */
    async by_id(id)
    {
        assert(undefined !== this.driver);
        this.element = await this.driver.findElement(By.id(id));
    }

    /**
     * send keys.
     * Modifier keys (SHIFT, CONTROL, ALT, META) are stateful; once a modifier is processed in the key sequence, that key state is toggled until one of the following occurs:
     * The modifier key is encountered again in the sequence. At this point the state of the key is toggled (along with the appropriate keyup/down events).
     * The input.Key.NULL key is encountered in the sequence. When this key is encountered, all modifier keys current in the down state are released (with accompanying keyup events). The NULL key can be used to simulate common keyboard shortcuts:
     */
    async keys(...keys)
    {
        assert(undefined !== this.element);
        await this.element.sendKeys(...keys);
    }

    async wait(ms)
    {
        assert(undefined !== this.driver);
        await this.driver.sleep(ms);
    }
}

module.exports = selenium;



