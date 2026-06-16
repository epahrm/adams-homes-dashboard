export const DIVISIONS = [
  // Alabama
  { id: 'baldwin-county', name: 'Baldwin County', state: 'AL', manager: 'Mike Ginn', managerEmail: 'mginn@adamshomes.com' },
  { id: 'huntsville', name: 'Huntsville', state: 'AL', manager: 'Jordan Province', managerEmail: 'jprovince@adamshomes.com' },

  // Texas
  { id: 'lonestar', name: 'Lonestar', state: 'TX', manager: 'Ryan Tapscott', managerEmail: 'rtapscott@adamshomes.com' },
  { id: 'north-houston', name: 'North Houston', state: 'TX', manager: 'David Modlin', managerEmail: 'dmodlin@adamshomes.com' },
  { id: 'south-houston', name: 'South Houston', state: 'TX', manager: 'Daryl Pavlicek', managerEmail: 'dpavlicek@adamshomes.com' },
  { id: 'austin', name: 'Austin', state: 'TX', manager: 'Nathan Branning', managerEmail: 'nbranning@adamshomes.com' },
  { id: 'san-antonio', name: 'San Antonio', state: 'TX', manager: 'John Brown', managerEmail: 'jbrown@adamshomes.com' },

  // Mississippi
  { id: 'mississippi', name: 'Mississippi', state: 'MS', manager: 'Nathan Branning', managerEmail: 'nbranning@adamshomes.com' },

  // North Carolina
  { id: 'raleigh', name: 'Raleigh', state: 'NC', manager: 'Nick Tsakanikas', managerEmail: 'ntsakanikas@adamshomes.com' },
  { id: 'north-raleigh', name: 'North Raleigh', state: 'NC', manager: 'Nick Tsakanikas', managerEmail: 'ntsakanikas@adamshomes.com' },
  { id: 'charlotte', name: 'Charlotte', state: 'NC', manager: 'Keith Ferguson', managerEmail: 'kferguson@adamshomes.com' },
  { id: 'winterville', name: 'Winterville', state: 'NC', manager: 'Scott Gibson', managerEmail: 'sgibson@adamshomes.com' },
  { id: 'wilmington', name: 'Wilmington', state: 'NC', manager: 'Chad Ferguson', managerEmail: 'cferguson@adamshomes.com' },

  // Florida - NW
  { id: 'pensacola', name: 'Pensacola', state: 'FL', manager: 'Ronnie Rainwater', managerEmail: 'rrainwater@adamshomes.com' },
  { id: 'destin', name: 'Destin', state: 'FL', manager: 'Hunter Bell', managerEmail: 'hbell@adamshomes.com' },
  { id: 'crestview', name: 'Crestview', state: 'FL', manager: 'Chad Willard', managerEmail: 'cwillard@adamshomes.com' },

  // Florida - EC
  { id: 'orlando', name: 'Orlando', state: 'FL', manager: 'Gary Farcus', managerEmail: 'gfarcus@adamshomes.com' },
  { id: 'jacksonville', name: 'Jacksonville', state: 'FL', manager: 'Scott Harris', managerEmail: 'sharris@adamshomes.com' },
  { id: 'daytona', name: 'Daytona', state: 'FL', manager: 'Phillip Verdin', managerEmail: 'pverdin@adamshomes.com' },
  { id: 'melbourne', name: 'Melbourne', state: 'FL', manager: 'Mark Terlep', managerEmail: 'mterlep@adamshomes.com' },
  { id: 'port-st-lucie', name: 'Port St Lucie', state: 'FL', manager: 'David Jackson', managerEmail: 'djackson@adamshomes.com' },

  // Florida - SW
  { id: 'tampa', name: 'Tampa', state: 'FL', manager: 'Grant Fierdrich', managerEmail: 'gfierdrich@adamshomes.com' },
  { id: 'fort-myers', name: 'Fort Myers', state: 'FL', manager: 'Mike Gay', managerEmail: 'mgay@adamshomes.com' },
  { id: 'lakeland', name: 'Lakeland', state: 'FL', manager: 'Misty Varner', managerEmail: 'mvarner@adamshomes.com' },
  { id: 'spring-hill', name: 'Spring Hill', state: 'FL', manager: 'John Roberts', managerEmail: 'jroberts@adamshomes.com' },
  { id: 'sarasota', name: 'Sarasota', state: 'FL', manager: 'Michael Kruszynski', managerEmail: 'mkruszynski@adamshomes.com' },
  { id: 'gainesville', name: 'Gainesville', state: 'FL', manager: 'Jake Bradley', managerEmail: 'jbradley@adamshomes.com' },

  // South Carolina
  { id: 'greenville', name: 'Greenville', state: 'SC', manager: 'Charles Thornton', managerEmail: 'cthornton@adamshomes.com' },
  { id: 'myrtle-beach', name: 'Myrtle Beach', state: 'SC', manager: 'George Mixson', managerEmail: 'gmixson@adamshomes.com' },
  { id: 'columbia', name: 'Columbia', state: 'SC', manager: 'Clayton Coe', managerEmail: 'ccoe@adamshomes.com' },

  // Georgia
  { id: 'atlanta-north', name: 'Atlanta North', state: 'GA', manager: 'Steve Pawlik', managerEmail: 'spawlik@adamshomes.com' },
  { id: 'atlanta-south', name: 'Atlanta South', state: 'GA', manager: 'Judy Mapp', managerEmail: 'jmapp@adamshomes.com' },
  { id: 'atlanta-west', name: 'Atlanta West', state: 'GA', manager: 'John Christian', managerEmail: 'jchristian@adamshomes.com' },
  { id: 'savannah', name: 'Savannah', state: 'GA', manager: 'TBD', managerEmail: 'tbd@adamshomes.com' },
]

export function getDivisionById(id: string) {
  return DIVISIONS.find(d => d.id === id)
}

export function getDivisionsByState(state: string) {
  return DIVISIONS.filter(d => d.state === state)
}
