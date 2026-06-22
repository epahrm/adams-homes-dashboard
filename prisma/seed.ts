import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10)
  return bcryptjs.hash(password, salt)
}

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.milestoneProgress.deleteMany({})
  await prisma.milestone.deleteMany({})
  await prisma.user.deleteMany({})

  // Create milestones
  const milestones = [
    {
      order: 1,
      title: 'SSP and Warrior Standards',
      description:
        'Understand the significance of a tailored sales plan and the expectations set by Adams Homes.',
      keyPoints: `• Understand sales plan customization
• Learn Adams Homes expectations and standards
• Review Warrior Program requirements
• Complete initial assessment`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    },
    {
      order: 2,
      title: 'CRM – Lasso',
      description:
        'Master Adams Homes\' CRM system, navigation, and basic functions.',
      keyPoints: `• Navigate the Lasso CRM system
• Understand basic functions and workflows
• Access training resources
• Set up your profile and preferences`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    },
    {
      order: 3,
      title: 'Our Website',
      description:
        'Understand the impact of digital model homes and the importance of ongoing maintenance.',
      keyPoints: `• Learn about digital model homes
• Understand website maintenance importance
• Audit website performance
• Identify appropriate update contacts`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
    },
    {
      order: 4,
      title: 'MLS for Success',
      description:
        'Master listing strategy, quality components, and Adams Homes\' expectations.',
      keyPoints: `• Create appealing and accurate listings
• Optimize listing components
• Ensure quality images and information
• Learn Adams Homes comments expectations`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    },
    {
      order: 5,
      title: 'Social Media & Marketing',
      description:
        'Master Adams Homes\' expectations and best practices for social media.',
      keyPoints: `• Understand Adams Homes brand guidelines
• Learn best practices for social content
• Access training resources
• Identify support contacts`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop',
    },
    {
      order: 6,
      title: 'Google (& Bing) Business Listings',
      description:
        'Optimize search engine listings and manage company community presence.',
      keyPoints: `• Work with Marketing for company listings
• Optimize with quality images
• Solicit customer and partner reviews
• Monitor listing performance`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    },
    {
      order: 7,
      title: 'Customer Experience Expectations',
      description:
        'Understand Adams Homes\' expectations and industry benchmarks for customer service.',
      keyPoints: `• Learn customer service standards
• Review industry benchmarks
• Understand service expectations
• Complete customer service assessment`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    },
    {
      order: 8,
      title: 'Prevent Lead Leakage',
      description:
        'Test lead syndications and audit your website to prevent lost leads.',
      keyPoints: `• Learn lead syndication testing
• Understand lead leakage risks
• Conduct website audits
• Implement tracking systems`,
      resourceUrl: '#',
      videoUrl: '#',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    },
  ]

  const createdMilestones = await Promise.all(
    milestones.map(m =>
      prisma.milestone.create({
        data: m,
      })
    )
  )

  console.log(`Created ${createdMilestones.length} milestones`)

  // Create demo user
  const hashedPassword = await hashPassword('password123')
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  })

  console.log('Created demo user:', demoUser.email)
  console.log('Seed completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
