import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-user-id')
    const userType = request.headers.get('x-user-type')

    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        division: true,
        hireDate: true,
        lassoLogin: true,
        emailLogin: true,
        fpgTrainingUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userType = request.headers.get('x-user-type')

    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'add') {
      const { email, name, division, hireDate, lassoLogin, lassoPassword, emailLogin, emailPassword, fpgTrainingUrl } = body

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 })
      }

      const tempPassword = Math.random().toString(36).slice(-12)
      const hashedPassword = await hashPassword(tempPassword)

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          division: division || '',
          hireDate: hireDate ? new Date(hireDate) : null,
          lassoLogin: lassoLogin || null,
          lassoPassword: lassoPassword ? await hashPassword(lassoPassword) : null,
          emailLogin: emailLogin || null,
          emailPassword: emailPassword ? await hashPassword(emailPassword) : null,
          fpgTrainingUrl: fpgTrainingUrl || null,
        },
      })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        tempPassword,
        message: 'User created. Share the temporary password with the employee.',
      })
    }

    if (action === 'update') {
      const { userId, lassoLogin, lassoPassword, emailLogin, emailPassword, fpgTrainingUrl, division, hireDate } = body

      const updateData: any = {
        division: division || '',
      }

      if (hireDate) updateData.hireDate = new Date(hireDate)
      if (lassoLogin !== undefined) updateData.lassoLogin = lassoLogin
      if (lassoPassword) updateData.lassoPassword = await hashPassword(lassoPassword)
      if (emailLogin !== undefined) updateData.emailLogin = emailLogin
      if (emailPassword) updateData.emailPassword = await hashPassword(emailPassword)
      if (fpgTrainingUrl !== undefined) updateData.fpgTrainingUrl = fpgTrainingUrl

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        message: 'User updated successfully',
      })
    }

    if (action === 'bulk-import') {
      const { users } = body

      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json({ error: 'Invalid users array' }, { status: 400 })
      }

      const results = []
      const errors = []

      for (let i = 0; i < users.length; i++) {
        try {
          const { email, name, division, hireDate, lassoLogin, lassoPassword, emailLogin, emailPassword, fpgTrainingUrl } = users[i]

          if (!email || !name) {
            errors.push({ row: i + 1, error: 'Missing email or name' })
            continue
          }

          const existing = await prisma.user.findUnique({ where: { email } })
          if (existing) {
            errors.push({ row: i + 1, error: `User ${email} already exists` })
            continue
          }

          const tempPassword = Math.random().toString(36).slice(-12)
          const hashedPassword = await hashPassword(tempPassword)

          const user = await prisma.user.create({
            data: {
              email,
              name,
              password: hashedPassword,
              division: division || '',
              hireDate: hireDate ? new Date(hireDate) : null,
              lassoLogin: lassoLogin || null,
              lassoPassword: lassoPassword ? await hashPassword(lassoPassword) : null,
              emailLogin: emailLogin || null,
              emailPassword: emailPassword ? await hashPassword(emailPassword) : null,
              fpgTrainingUrl: fpgTrainingUrl || null,
            },
          })

          results.push({
            email,
            name,
            tempPassword,
          })
        } catch (error) {
          errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }

      return NextResponse.json({
        imported: results.length,
        failed: errors.length,
        results,
        errors,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
