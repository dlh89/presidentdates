// Accession dates rather than oath or public ceremony dates.
export const presidents = [
    ['1789-04-30', 'George Washington'], ['1797-03-04', 'John Adams'], ['1801-03-04', 'Thomas Jefferson'], ['1809-03-04', 'James Madison'], ['1817-03-04', 'James Monroe'], ['1825-03-04', 'John Quincy Adams'], ['1829-03-04', 'Andrew Jackson'], ['1837-03-04', 'Martin Van Buren'], ['1841-03-04', 'William Henry Harrison'], ['1841-04-04', 'John Tyler'], ['1845-03-04', 'James K. Polk'], ['1849-03-04', 'Zachary Taylor'], ['1850-07-09', 'Millard Fillmore'], ['1853-03-04', 'Franklin Pierce'], ['1857-03-04', 'James Buchanan'], ['1861-03-04', 'Abraham Lincoln'], ['1865-04-15', 'Andrew Johnson'], ['1869-03-04', 'Ulysses S. Grant'], ['1877-03-04', 'Rutherford B. Hayes'], ['1881-03-04', 'James A. Garfield'], ['1881-09-19', 'Chester A. Arthur'], ['1885-03-04', 'Grover Cleveland'], ['1889-03-04', 'Benjamin Harrison'], ['1893-03-04', 'Grover Cleveland'], ['1897-03-04', 'William McKinley'], ['1901-09-14', 'Theodore Roosevelt'], ['1909-03-04', 'William Howard Taft'], ['1913-03-04', 'Woodrow Wilson'], ['1921-03-04', 'Warren G. Harding'], ['1923-08-02', 'Calvin Coolidge'], ['1929-03-04', 'Herbert Hoover'], ['1933-03-04', 'Franklin D. Roosevelt'], ['1945-04-12', 'Harry S. Truman'], ['1953-01-20', 'Dwight D. Eisenhower'], ['1961-01-20', 'John F. Kennedy'], ['1963-11-22', 'Lyndon B. Johnson'], ['1969-01-20', 'Richard Nixon'], ['1974-08-09', 'Gerald Ford'], ['1977-01-20', 'Jimmy Carter'], ['1981-01-20', 'Ronald Reagan'], ['1989-01-20', 'George H. W. Bush'], ['1993-01-20', 'Bill Clinton'], ['2001-01-20', 'George W. Bush'], ['2009-01-20', 'Barack Obama'], ['2017-01-20', 'Donald Trump'], ['2021-01-20', 'Joe Biden'], ['2025-01-20', 'Donald Trump'],
];
export const firstDate = presidents[0][0];
export const time = (s) => Date.parse(s + 'T12:00:00Z');
export const iso = (t) => new Date(t).toISOString().slice(0, 10);
export const pretty = (s) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(time(s)));
export function answer(date) {
    let i = presidents.length - 1;
    while (i > 0 && presidents[i][0] > date)
        i--;
    const current = presidents[i], transition = i > 0 && current[0] === date;
    return { name: transition ? presidents[i - 1][1] + ' → ' + current[1] : current[1],
        detail: transition ? 'A handover day: ' + presidents[i - 1][1] + ' first, then ' + current[1] + '. Either name alone needs this qualification.' : current[1] + ' took office on ' + pretty(current[0]) + '.' };
}
const pick = (a, rng) => a[Math.floor(rng() * a.length)];
export function choose(history, today, recent = [], rng = Math.random) {
    const min = time(firstDate), max = time(today), day = 86400000;
    const transitions = presidents.slice(1).filter(p => p[0] <= today);
    const years = new Set(presidents.map(p => +p[0].slice(0, 4)));
    const ordinary = Array.from({ length: +today.slice(0, 4) - 1789 + 1 }, (_, i) => 1789 + i).filter(y => !years.has(y));
    const topic = (date) => transitions.find(p => Math.abs(time(p[0]) - time(date)) <= 45 * day)?.[0] ?? date.slice(0, 4);
    const weak = new Map();
    for (const a of history.slice().sort((a, b) => a.createdAt - b.createdAt)) {
        const key = topic(a.date), old = weak.get(key);
        weak.set(key, { date: a.date, weight: a.correct ? (old?.weight ?? 0) * 0.45 : Math.min(10, (old?.weight ?? 0) + 3) });
    }
    const pool = [...weak.values()].filter(x => x.weight > 0.4);
    for (let tries = 0; tries < 80; tries++) {
        const mode = rng();
        let date, kind;
        if (mode < 0.5) {
            const year = pick(ordinary, rng), start = time(year + '-01-01'), end = Math.min(time(year + '-12-31'), max);
            date = iso(start + Math.floor(rng() * ((end - start) / day + 1)) * day);
            kind = 'ordinary';
        }
        else if (mode < 0.75 || !pool.length) {
            const p = pick(transitions, rng);
            date = iso(time(p[0]) + pick([-40, -15, -7, -2, -1, 0, 1, 2, 7, 15, 40], rng) * day);
            kind = 'handover';
        }
        else {
            let roll = rng() * pool.reduce((sum, x) => sum + x.weight, 0), target = pool[pool.length - 1];
            for (const x of pool) {
                roll -= x.weight;
                if (roll <= 0) {
                    target = x;
                    break;
                }
            }
            const boundary = transitions.find(p => Math.abs(time(p[0]) - time(target.date)) <= 45 * day);
            date = iso(time(boundary?.[0] ?? target.date) + pick([-30, -7, -2, -1, 0, 1, 2, 7, 30], rng) * day);
            kind = 'review';
        }
        if (time(date) >= min && time(date) <= max && !recent.includes(date))
            return { date, kind };
    }
    return { date: iso(min + Math.floor(rng() * ((max - min) / day + 1)) * day), kind: 'ordinary' };
}
