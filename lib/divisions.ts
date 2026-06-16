export const DIVISIONS = [
  // Alabama
  { id: 'baldwin-county', name: 'Baldwin County', state: 'AL', manager: 'Mike Ginn' },
  { id: 'huntsville', name: 'Huntsville', state: 'AL', manager: 'Jordan Province' },

  // Texas
  { id: 'lonestar', name: 'Lonestar', state: 'TX', manager: 'Ryan Tapscott' },
  { id: 'north-houston', name: 'North Houston', state: 'TX', manager: 'David Modlin' },
  { id: 'south-houston', name: 'South Houston', state: 'TX', manager: 'Daryl Pavlicek' },
  { id: 'austin', name: 'Austin', state: 'TX', manager: 'Nathan Branning' },
  { id: 'san-antonio', name: 'San Antonio', state: 'TX', manager: 'John Brown' },

  // Mississippi
  { id: 'mississippi', name: 'Mississippi', state: 'MS', manager: 'Nathan Branning' },

  // North Carolina
  { id: 'raleigh', name: 'Raleigh', state: 'NC', manager: 'Nick Tsakanikas' },
  { id: 'north-raleigh', name: 'North Raleigh', state: 'NC', manager: 'Nick Tsakanikas' },
  { id: 'charlotte', name: 'Charlotte', state: 'NC', manager: 'Keith Ferguson' },
  { id: 'winterville', name: 'Winterville', state: 'NC', manager: 'Scott Gibson' },
  { id: 'wilmington', name: 'Wilmington', state: 'NC', manager: 'Chad Ferguson' },

  // Florida - NW
  { id: 'pensacola', name: 'Pensacola', state: 'FL', manager: 'Ronnie Rainwater' },
  { id: 'destin', name: 'Destin', state: 'FL', manager: 'Hunter Bell' },
  { id: 'crestview', name: 'Crestview', state: 'FL', manager: 'Chad Willard' },

  // Florida - EC
  { id: 'orlando', name: 'Orlando', state: 'FL', manager: 'Gary Farcus' },
  { id: 'jacksonville', name: 'Jacksonville', state: 'FL', manager: 'Scott Harris' },
  { id: 'daytona', name: 'Daytona', state: 'FL', manager: 'Phillip Verdin' },
  { id: 'melbourne', name: 'Melbourne', state: 'FL', manager: 'Mark Terlep' },
  { id: 'port-st-lucie', name: 'Port St Lucie', state: 'FL', manager: 'David Jackson' },

  // Florida - SW
  { id: 'tampa', name: 'Tampa', state: 'FL', manager: 'Grant Fierdrich' },
  { id: 'fort-myers', name: 'Fort Myers', state: 'FL', manager: 'Mike Gay' },
  { id: 'lakeland', name: 'Lakeland', state: 'FL', manager: 'Misty Varner' },
  { id: 'spring-hill', name: 'Spring Hill', state: 'FL', manager: 'John Roberts' },
  { id: 'sarasota', name: 'Sarasota', state: 'FL', manager: 'Michael Kruszynski' },
  { id: 'gainesville', name: 'Gainesville', state: 'FL', manager: 'Jake Bradley' },

  // South Carolina
  { id: 'greenville', name: 'Greenville', state: 'SC', manager: 'Charles Thornton' },
  { id: 'myrtle-beach', name: 'Myrtle Beach', state: 'SC', manager: 'George Mixson' },
  { id: 'columbia', name: 'Columbia', state: 'SC', manager: 'Clayton Coe' },

  // Georgia
  { id: 'atlanta-north', name: 'Atlanta North', state: 'GA', manager: 'Steve Pawlik' },
  { id: 'atlanta-south', name: 'Atlanta South', state: 'GA', manager: 'Judy Mapp' },
  { id: 'atlanta-west', name: 'Atlanta West', state: 'GA', manager: 'John Christian' },
  { id: 'savannah', name: 'Savannah', state: 'GA', manager: 'TBD' },
]

export function getDivisionById(id: string) {
  return DIVISIONS.find(d => d.id === id)
}

export function getDivisionsByState(state: string) {
  return DIVISIONS.filter(d => d.state === state)
}
