import {presidents,answer} from './history.js';
// Short factual summaries; source links are shown beside each biography.
export const biographies={
  "George Washington": {
    "bullets": [
      "Commanded the Continental Army in the American Revolution.",
      "Established the presidency’s early practices and stepped down after two terms."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/georgewashington"
  },
  "John Adams": {
    "bullets": [
      "Founding Father, diplomat and Washington’s vice president.",
      "His presidency included the undeclared naval conflict with France known as the Quasi-War."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/johnadams"
  },
  "Thomas Jefferson": {
    "bullets": [
      "Principal author of the Declaration of Independence.",
      "His administration made the Louisiana Purchase in 1803."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/thomasjefferson"
  },
  "James Madison": {
    "bullets": [
      "Helped frame the Constitution and championed the Bill of Rights.",
      "Led the country during the War of 1812."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/jamesmadison"
  },
  "James Monroe": {
    "bullets": [
      "Revolutionary War veteran and former secretary of state.",
      "Announced the Monroe Doctrine against further European colonisation in the Americas."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/jamesmonroe"
  },
  "John Quincy Adams": {
    "bullets": [
      "Diplomat, former secretary of state and son of John Adams.",
      "Later served in the House of Representatives and opposed slavery."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/johnquincyadams"
  },
  "Andrew Jackson": {
    "bullets": [
      "General celebrated for his victory at the Battle of New Orleans.",
      "Signed the Indian Removal Act, enabling forced displacement of Native peoples."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/andrewjackson"
  },
  "Martin Van Buren": {
    "bullets": [
      "New York politician who served as Jackson’s secretary of state and vice president.",
      "His presidency was dominated by the Panic of 1837 and its economic aftermath."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/martinvanburen"
  },
  "William Henry Harrison": {
    "bullets": [
      "Military officer associated with the Battle of Tippecanoe.",
      "Died about a month after taking office, the shortest presidency."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/williamhenryharrison"
  },
  "John Tyler": {
    "bullets": [
      "First vice president to become president following a president’s death.",
      "Broke with the Whig Party while in office."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/johntyler"
  },
  "James K. Polk": {
    "bullets": [
      "Former speaker of the House and governor of Tennessee.",
      "Led the country during the Mexican–American War and major territorial expansion."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/jamespolk"
  },
  "Zachary Taylor": {
    "bullets": [
      "Career soldier and general in the Mexican–American War.",
      "Died in office in 1850, leaving Millard Fillmore to succeed him."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/zacharytaylor"
  },
  "Millard Fillmore": {
    "bullets": [
      "New York lawyer and the last Whig president.",
      "Signed the Compromise of 1850 laws, including the Fugitive Slave Act."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/millardfillmore"
  },
  "Franklin Pierce": {
    "bullets": [
      "New Hampshire Democrat and veteran of the Mexican–American War.",
      "Signed the Kansas–Nebraska Act, intensifying conflict over slavery."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/franklinpierce"
  },
  "James Buchanan": {
    "bullets": [
      "Former secretary of state and diplomat from Pennsylvania.",
      "Southern states began seceding during his final months in office."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/jamesbuchanan"
  },
  "Abraham Lincoln": {
    "bullets": [
      "Led the Union during the American Civil War.",
      "Issued the Emancipation Proclamation; assassinated in 1865."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/abrahamlincoln"
  },
  "Andrew Johnson": {
    "bullets": [
      "Tennessee politician who succeeded Lincoln during Reconstruction.",
      "Impeached by the House; acquitted in the Senate by one vote."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/andrewjohnson"
  },
  "Ulysses S. Grant": {
    "bullets": [
      "Commanding Union general during the Civil War.",
      "As president, used federal power against the Ku Klux Klan."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/ulyssessgrant"
  },
  "Rutherford B. Hayes": {
    "bullets": [
      "Civil War officer and former governor of Ohio.",
      "Became president after the disputed 1876 election and oversaw the end of Reconstruction."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/rutherfordbhayes"
  },
  "James A. Garfield": {
    "bullets": [
      "Former Union general and Ohio congressman.",
      "Shot in 1881 and died later that year, ending a brief presidency."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/jamesgarfield"
  },
  "Chester A. Arthur": {
    "bullets": [
      "Former New York customs collector who succeeded Garfield.",
      "Signed the Pendleton Act, establishing a merit-based federal civil service."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/chesterarthur"
  },
  "Grover Cleveland": {
    "bullets": [
      "Former mayor of Buffalo and governor of New York.",
      "Served two nonconsecutive presidencies, separated by Benjamin Harrison’s."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/grovercleveland22"
  },
  "Benjamin Harrison": {
    "bullets": [
      "Civil War veteran and grandson of William Henry Harrison.",
      "Signed the Sherman Antitrust Act in 1890."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/benjaminharrison"
  },
  "William McKinley": {
    "bullets": [
      "Former Ohio governor and Civil War veteran.",
      "President during the Spanish–American War; assassinated in 1901."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/williammckinley"
  },
  "Theodore Roosevelt": {
    "bullets": [
      "Former New York governor and Spanish–American War veteran.",
      "Promoted conservation and challenged powerful business trusts."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/theodoreroosevelt"
  },
  "William Howard Taft": {
    "bullets": [
      "Lawyer and former secretary of war.",
      "Later became chief justice—the only person to hold both offices."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/williamhowardtaft"
  },
  "Woodrow Wilson": {
    "bullets": [
      "Former Princeton University president and New Jersey governor.",
      "Led the US during World War I and advocated the League of Nations."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/woodrowwilson"
  },
  "Warren G. Harding": {
    "bullets": [
      "Ohio newspaper publisher and senator before becoming president.",
      "His administration was associated with scandals, including Teapot Dome."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/warrenharding"
  },
  "Calvin Coolidge": {
    "bullets": [
      "Former Massachusetts governor who succeeded Harding.",
      "Favoured lower taxes and restrained federal spending during the 1920s."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/calvincoolidge"
  },
  "Herbert Hoover": {
    "bullets": [
      "Engineer and humanitarian relief organiser before becoming president.",
      "The Great Depression began during his presidency."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/herberthoover"
  },
  "Franklin D. Roosevelt": {
    "bullets": [
      "Former New York governor and the only president elected four times.",
      "Introduced the New Deal and led the US through most of World War II."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/franklindroosevelt"
  },
  "Harry S. Truman": {
    "bullets": [
      "Missouri senator who became president after FDR’s death.",
      "Made the decision to use atomic bombs against Japan; president during the Korean War."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/harrystruman"
  },
  "Dwight D. Eisenhower": {
    "bullets": [
      "Supreme Allied Commander in Europe during World War II.",
      "Signed the legislation creating the Interstate Highway System."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/dwightdeisenhower"
  },
  "John F. Kennedy": {
    "bullets": [
      "Former Massachusetts senator and World War II naval officer.",
      "President during the Cuban Missile Crisis; assassinated in Dallas in 1963."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/johnfkennedy"
  },
  "Lyndon B. Johnson": {
    "bullets": [
      "Former Senate majority leader who succeeded Kennedy.",
      "Signed major civil-rights laws and expanded US involvement in Vietnam."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/lyndonbjohnson"
  },
  "Richard Nixon": {
    "bullets": [
      "Former California senator and Eisenhower’s vice president.",
      "Visited China in 1972; resigned amid Watergate."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/richardnixon"
  },
  "Gerald Ford": {
    "bullets": [
      "Former House minority leader appointed vice president before succeeding Nixon.",
      "Pardoned Nixon; never elected to the presidency or vice presidency."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/geraldford"
  },
  "Jimmy Carter": {
    "bullets": [
      "Former naval officer and governor of Georgia.",
      "Brokered the Camp David Accords between Egypt and Israel."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/jimmycarter"
  },
  "Ronald Reagan": {
    "bullets": [
      "Former actor and governor of California.",
      "Pursued tax cuts and negotiated arms-control agreements with the Soviet Union."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/ronaldreagan"
  },
  "George H. W. Bush": {
    "bullets": [
      "Former CIA director and Reagan’s vice president.",
      "Led the US during the 1991 Gulf War and the end of the Cold War."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/georgehwbush"
  },
  "Bill Clinton": {
    "bullets": [
      "Former governor of Arkansas.",
      "Signed NAFTA into law; impeached by the House and acquitted by the Senate."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/williamjclinton"
  },
  "George W. Bush": {
    "bullets": [
      "Former Texas governor and son of George H. W. Bush.",
      "Led the US after the September 11 attacks, including wars in Afghanistan and Iraq."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/georgewbush"
  },
  "Barack Obama": {
    "bullets": [
      "Former Illinois senator and the first African American president.",
      "Signed the Affordable Care Act in 2010."
    ],
    "source": "https://obamawhitehouse.archives.gov/1600/presidents/barackobama"
  },
  "Donald Trump": {
    "bullets": [
      "Real-estate businessman and television personality before becoming president.",
      "Served nonconsecutive presidencies beginning in 2017 and 2025."
    ],
    "source": "https://www.whitehouse.gov/administration/donald-j-trump/"
  },
  "Joe Biden": {
    "bullets": [
      "Represented Delaware in the Senate for 36 years.",
      "Served as Barack Obama’s vice president before becoming president."
    ],
    "source": "https://bidenwhitehouse.archives.gov/administration/president-biden/"
  }
};

export function ordinal(n){
 const lastTwo=n%100;
 return n+(lastTwo>=11&&lastTwo<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]??'th'));
}

export function revealedPresidents(date){
 return answer(date).indices.map(index=>{
  const name=presidents[index][1],bio=biographies[name];
  const neighbour=i=>i>=0&&i<presidents.length?{number:i+1,name:presidents[i][1]}:null;
  return {number:index+1,numberLabel:ordinal(index+1)+' president',name,
   previous:neighbour(index-1),next:neighbour(index+1),bullets:bio.bullets,source:bio.source};
 });
}
