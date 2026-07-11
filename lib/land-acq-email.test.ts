import { parseListingEmail, sourceFromSender, htmlToText } from './land-acq-email'

describe('Email Parser Tests', () => {
  describe('sourceFromSender', () => {
    test('identifies Zillow', () => {
      expect(sourceFromSender('noreply@zillow.com')).toBe('Zillow')
    })
    test('identifies Realtor.com', () => {
      expect(sourceFromSender('alerts@realtor.com')).toBe('Realtor.com')
    })
    test('identifies Crexi', () => {
      expect(sourceFromSender('noreply@crexi.com')).toBe('Crexi')
    })
    test('identifies LoopNet', () => {
      expect(sourceFromSender('alert@costar.com')).toBe('LoopNet')
    })
  })

  describe('htmlToText', () => {
    test('strips HTML tags', () => {
      expect(htmlToText('<div>Hello <b>world</b></div>')).toBe('Hello world')
    })
    test('handles HTML entities', () => {
      expect(htmlToText('Acme &amp; Co.&nbsp;Real&nbsp;Estate')).toBe('Acme & Co. Real Estate')
    })
  })

  describe('Realtor.com Parser', () => {
    test('parses complete Realtor.com saved-search alert', () => {
      const email = {
        from: 'alerts@realtor.com',
        subject: 'Your Saved Search - New Listings',
        html: `
          <html>
          <body>
          <div class="listing-card">
            <h2>123 Oak Street, Palm Bay, FL 32905</h2>
            <div class="price">$285,000</div>
            <div class="details">
              <span class="acres">2.5 acres</span>
              <span class="mls">MLS ID #2026019833</span>
              <p>Listed by: John Smith | Phone: 321-555-0123</p>
              <p>Email: john.smith@realtorco.com</p>
              <p>Brokerage: Keller Williams Island Life RE</p>
            </div>
            <p>Days on Market: 14 days</p>
            <a href="https://www.realtor.com/realestate/123-oak-st/palm-bay-fl-32905/">View Property</a>
          </div>
          </body>
          </html>
        `,
        text: '',
      }

      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      const listing = results[0]
      expect(listing.address).toBe('123 Oak Street, Palm Bay, FL 32905')
      expect(listing.listPrice).toBe(285000)
      expect(listing.acres).toBe(2.5)
      expect(listing.mls).toBe('2026019833')
      expect(listing.source).toBe('Realtor.com')
      expect(listing.agentName).toBe('John Smith')
      expect(listing.agentPhone).toContain('321')
      expect(listing.agentEmail).toBe('john.smith@realtorco.com')
    })

    test('handles multiple listings in one alert', () => {
      const email = {
        from: 'alerts@realtor.com',
        html: `
          <div>
            <h2>456 Maple Ave, Palm Bay, FL 32907</h2>
            <div class="price">$195,000</div>
            <div>1.2 acres</div>
            <p>Listed by: Sarah Johnson</p>
            <p>MLS ID #2026018765</p>
            <a href="https://realtor.com/maple-456">View</a>

            <h2>789 Pine Lane, Palm Bay, FL 32909</h2>
            <div class="price">$325,000</div>
            <div>3.8 acres</div>
            <p>Listed by: Mike Davis</p>
            <p>MLS ID #2026020111</p>
            <a href="https://realtor.com/pine-789">View</a>
          </div>
        `,
        text: '',
      }

      const results = parseListingEmail(email)
      expect(results).toHaveLength(2)
      expect(results[0].address).toContain('456 Maple')
      expect(results[1].address).toContain('789 Pine')
    })

    test('handles missing optional fields', () => {
      const email = {
        from: 'alerts@realtor.com',
        html: `
          <div>
            <h2>999 Unknown St, Palm Bay, FL 32901</h2>
            <div class="price">$150,000</div>
            <a href="https://realtor.com/unknown-999">View</a>
          </div>
        `,
        text: '',
      }

      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      const listing = results[0]
      expect(listing.address).toBe('999 Unknown St, Palm Bay, FL 32901')
      expect(listing.listPrice).toBe(150000)
      expect(listing.acres).toBeNull()
      expect(listing.mls).toBeNull()
      expect(listing.agentName).toBeUndefined()
    })
  })

  describe('Crexi Parser', () => {
    test('parses Crexi card-based alert (no street address)', () => {
      const email = {
        from: 'noreply@crexi.com',
        subject: 'New Opportunity: Palm Bay Industrial',
        html: `
          <div class="property-card">
            <h3>Premium Commercial Land - Palm Bay, FL Land | 5.5 acres</h3>
            <p>Type: Industrial/Commercial</p>
            <p>Listed Price: $425,000</p>
            <p>Brokerage: CBRE Commercial</p>
            <p>Contact: Lisa Martinez</p>
            <p>Phone: 305-555-8765</p>
            <p>Email: lmartinez@cbre.com</p>
            <a href="https://crexi.com/api/click/tracking123">View Property</a>
          </div>
        `,
        text: '',
      }

      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      const listing = results[0]
      expect(listing.needsAddress).toBe(true)
      expect(listing.address).toContain('Premium Commercial Land')
      expect(listing.address).toContain('Palm Bay, FL')
      expect(listing.acres).toBe(5.5)
      expect(listing.source).toBe('Crexi')
      expect(listing.agentName).toBe('Lisa Martinez')
      expect(listing.agentPhone).toContain('305')
    })

    test('handles Crexi without price in card', () => {
      const email = {
        from: 'noreply@crexi.com',
        html: `
          <div class="property-card">
            <h3>Commercial Lot - Palm Bay, FL Land | 2.0 acres</h3>
            <p>Contact: Bob Wilson | 561-555-0199</p>
            <a href="https://crexi.com/property/12345">View Property</a>
          </div>
        `,
        text: '',
      }

      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      const listing = results[0]
      expect(listing.needsAddress).toBe(true)
      expect(listing.acres).toBe(2.0)
      expect(listing.listPrice).toBeNull()
    })
  })

  describe('LoopNet Parser', () => {
    test('parses LoopNet email with full listing details', () => {
      const email = {
        from: 'alerts@costar.com',
        subject: 'LoopNet Alert: New Industrial Property',
        html: `
          <table>
            <tr>
              <td><strong>Property Address</strong></td>
              <td>567 Commercial Blvd, Palm Bay, FL 32906</td>
            </tr>
            <tr>
              <td><strong>Asset Class</strong></td>
              <td>Land</td>
            </tr>
            <tr>
              <td><strong>Listing Price</strong></td>
              <td>$895,000</td>
            </tr>
            <tr>
              <td><strong>Land Area</strong></td>
              <td>8.75 acres</td>
            </tr>
            <tr>
              <td><strong>Listing Broker</strong></td>
              <td>Marcus & Millichap Commercial</td>
            </tr>
            <tr>
              <td><strong>Contact</strong></td>
              <td>Robert Chen</td>
            </tr>
            <tr>
              <td><strong>Phone</strong></td>
              <td>(321) 555-4567</td>
            </tr>
            <tr>
              <td><strong>Email</strong></td>
              <td>r.chen@marcusmillichap.com</td>
            </tr>
            <tr>
              <td><strong>MLS Number</strong></td>
              <td>MLS ID #LL2026055432</td>
            </tr>
            <a href="https://www.loopnet.com/Listing/567-Commercial-Blvd-Palm-Bay-FL/12345678/">View Details</a>
          </table>
        `,
        text: '',
      }

      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      const listing = results[0]
      expect(listing.address).toBe('567 Commercial Blvd, Palm Bay, FL 32906')
      expect(listing.listPrice).toBe(895000)
      expect(listing.acres).toBe(8.75)
      expect(listing.source).toBe('LoopNet')
      expect(listing.mls).toBe('LL2026055432')
      expect(listing.brokerage).toContain('Marcus')
      expect(listing.agentName).toBe('Robert Chen')
      expect(listing.agentPhone).toContain('321')
      expect(listing.agentEmail).toBe('r.chen@marcusmillichap.com')
    })

    test('handles LoopNet with abbreviated address format', () => {
      const email = {
        from: 'alerts@costar.com',
        html: `
          <div>
            <span>210 Commerce Ln, Palm Bay, FL 32903</span>
            <span class="price">$550,000</span>
            <span class="size">4.2 acres</span>
            <span class="broker">NAI Tampa Bay</span>
            <span class="agent">Jennifer Ross</span>
            <span class="phone">727-555-8899</span>
            <span class="mls">MLS ID #LL2026042198</span>
            <a href="https://loopnet.com/commerce-210">View</a>
          </div>
        `,
        text: '',
      }

      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      const listing = results[0]
      expect(listing.address).toBe('210 Commerce Ln, Palm Bay, FL 32903')
      expect(listing.acres).toBe(4.2)
      expect(listing.mls).toContain('LL2026042198')
    })
  })

  describe('Cross-parser edge cases', () => {
    test('returns empty array for non-Palm Bay emails', () => {
      const email = {
        from: 'alerts@realtor.com',
        html: '<div>123 Oak St, Miami, FL 33101 - $300,000</div>',
        text: '',
      }
      const results = parseListingEmail(email)
      expect(results).toHaveLength(0)
    })

    test('handles price variations ($, no separator)', () => {
      const email = {
        from: 'alerts@realtor.com',
        html: '<div>111 Test Ave, Palm Bay, FL 32901 Price: $250000 1.5 acres</div>',
        text: '',
      }
      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      expect(results[0].listPrice).toBe(250000)
    })

    test('deduplicates duplicate listings in single email', () => {
      const email = {
        from: 'alerts@realtor.com',
        html: `
          <div>
            <h2>555 Duplicate Dr, Palm Bay, FL 32910</h2>
            <p>$500,000 - 3.5 acres</p>
            <h2>555 Duplicate Dr, Palm Bay, FL 32910</h2>
            <p>$500,000 - 3.5 acres (Listed again)</p>
          </div>
        `,
        text: '',
      }
      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      expect(results[0].address).toBe('555 Duplicate Dr, Palm Bay, FL 32910')
    })

    test('extracts square footage and converts to acres', () => {
      const email = {
        from: 'alerts@realtor.com',
        html: '<div>222 Sqft Lane, Palm Bay, FL 32902 $180,000 435,600 sq ft</div>',
        text: '',
      }
      const results = parseListingEmail(email)
      expect(results).toHaveLength(1)
      // 435,600 sq ft / 43,560 = 10 acres
      expect(results[0].acres).toBe(10)
    })
  })
})
