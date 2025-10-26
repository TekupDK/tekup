# 🤝 Contributing to RenOS

Tak for din interesse i at bidrage til RenOS! Denne guide hjælper dig med at komme i gang med at bidrage til projektet.

## 📋 Indhold

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## 📜 Code of Conduct

RenOS følger en inkluderende og respektfuld kultur. Alle bidragydere skal:

- Være respektfulde over for andre
- Være konstruktive i feedback
- Fokusere på det der er bedst for fællesskabet
- Være åbne for forskellige synspunkter

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm eller yarn
- Git
- VS Code (anbefalet)

### Fork og Clone
```bash
# Fork repository på GitHub
# Clone din fork
git clone https://github.com/YOUR_USERNAME/renos.git
cd renos

# Add upstream remote
git remote add upstream https://github.com/original-org/renos.git
```

## 🛠️ Development Setup

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=https://api.renos.dk
```

## 🔄 Making Changes

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b fix/your-bugfix-name

# Create hotfix branch
git checkout -b hotfix/your-hotfix-name
```

### Commit Messages
Vi følger [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add customer search functionality"

# Bug fix
git commit -m "fix: resolve navigation issue on mobile"

# Breaking change
git commit -m "feat!: redesign customer form interface"

# Documentation
git commit -m "docs: update API documentation"

# Style
git commit -m "style: format code with prettier"

# Refactor
git commit -m "refactor: improve component structure"

# Test
git commit -m "test: add unit tests for customer service"

# Chore
git commit -m "chore: update dependencies"
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

## 🔀 Pull Request Process

### Before Submitting
1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run tests**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

3. **Update documentation**
   - Update relevant docs
   - Add/update comments
   - Update CHANGELOG.md

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Related Issues
Closes #123
```

### Review Process
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on staging environment
4. **Approval** from at least one maintainer

## 📏 Coding Standards

### TypeScript
```typescript
// Use strict typing
interface Customer {
  id: string;
  name: string;
  email?: string;
}

// Use proper error handling
try {
  const result = await api.getCustomer(id);
  return result;
} catch (error) {
  console.error('Failed to fetch customer:', error);
  throw new Error('Customer not found');
}

// Use meaningful variable names
const customerList = customers.filter(c => c.status === 'active');
// Not: const list = customers.filter(c => c.s === 'a');
```

### React Components
```typescript
// Use functional components with hooks
const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    onEdit(customer);
  }, [customer, onEdit]);
  
  return (
    <div className="glass-card p-4">
      <h3>{customer.name}</h3>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
};
```

### CSS/Styling
```css
/* Use Tailwind classes */
.glass-card {
  @apply bg-glass/10 backdrop-blur-md border border-glass/20 rounded-xl;
}

/* Use CSS variables for theming */
:root {
  --primary: #3b82f6;
  --accent: #8b5cf6;
}
```

### File Organization
```
src/
├── components/           # Reusable components
│   ├── ui/              # Base UI components
│   └── feature/         # Feature-specific components
├── pages/               # Page components
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── types/               # TypeScript types
└── router/              # Routing logic
```

## 🧪 Testing

### Unit Tests
```typescript
// Test component behavior
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerCard } from '../CustomerCard';

describe('CustomerCard', () => {
  it('renders customer name', () => {
    const customer = { id: '1', name: 'John Doe' };
    render(<CustomerCard customer={customer} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    const customer = { id: '1', name: 'John Doe' };
    render(<CustomerCard customer={customer} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(customer);
  });
});
```

### Integration Tests
```typescript
// Test API integration
import { render, screen, waitFor } from '@testing-library/react';
import { CustomersPage } from '../CustomersPage';

describe('CustomersPage', () => {
  it('loads and displays customers', async () => {
    render(<CustomersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
```typescript
// Test user workflows
import { test, expect } from '@playwright/test';

test('user can create customer', async ({ page }) => {
  await page.goto('/customers');
  await page.click('text=Add Customer');
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.click('text=Save');
  
  await expect(page.locator('text=John Doe')).toBeVisible();
});
```

## 📚 Documentation

### Code Documentation
```typescript
/**
 * Customer service for managing customer data
 */
export class CustomerService {
  /**
   * Fetches all customers from the API
   * @param options - Query options
   * @returns Promise with customer data
   */
  async getCustomers(options?: QueryOptions): Promise<Customer[]> {
    // Implementation
  }
}
```

### README Updates
- Update feature lists
- Update installation instructions
- Update configuration examples
- Update troubleshooting section

### API Documentation
- Document new endpoints
- Update request/response examples
- Update error codes
- Update authentication requirements

## 🚀 Release Process

### Version Bumping
```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Tag created
- [ ] Release notes written

## 🐛 Bug Reports

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]

## Screenshots
If applicable, add screenshots

## Additional Context
Any other context about the problem
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives
Any alternative solutions considered?

## Additional Context
Any other context or screenshots
```

## 🏷️ Labels

We use labels to categorize issues and PRs:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation changes
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `priority: high`: High priority
- `priority: low`: Low priority
- `status: in progress`: Currently being worked on
- `status: blocked`: Blocked by something else

## 📞 Getting Help

### Resources
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Community discussions
- **Email**: dev@renos.dk
- **Documentation**: Check docs/ folder

### Questions
- Use GitHub Discussions for questions
- Check existing issues first
- Be specific about your problem
- Provide relevant code examples

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page
- Project documentation

## 📄 License

By contributing to RenOS, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to RenOS!** 🚀

Together we're building the future of rendetalje management.
