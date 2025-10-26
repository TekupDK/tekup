import React from 'react'
import { motion } from 'framer-motion'
import { FolderKanban, Plus, Users, Clock, BarChart3, Calendar, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ProjectManagementApp() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-warning-400" />
              AI Project Management
            </h1>
            <p className="text-slate-400 mt-2">
              Intelligent project planning og team collaboration
            </p>
          </div>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nyt Projekt
          </button>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Aktive Projekter', value: '24', change: '+3', icon: <FolderKanban className="w-5 h-5" /> },
            { label: 'Team Members', value: '67', change: '+8', icon: <Users className="w-5 h-5" /> },
            { label: 'Opgaver i gang', value: '156', change: '+12', icon: <Clock className="w-5 h-5" /> },
            { label: 'Completion Rate', value: '89.2%', change: '+2.3%', icon: <BarChart3 className="w-5 h-5" /> }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-glass"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-warning-500/20 text-warning-400 rounded-lg">
                  {stat.icon}
                </div>
                <span className="text-xs text-success-400 font-medium">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Project Kanban Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Project Board</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { 
                status: 'Backlog', 
                count: 23, 
                color: 'slate',
                tasks: [
                  { title: 'AI Model Training', priority: 'High', assignee: 'ML' },
                  { title: 'Database Migration', priority: 'Medium', assignee: 'BE' }
                ]
              },
              { 
                status: 'In Progress', 
                count: 8, 
                color: 'primary',
                tasks: [
                  { title: 'Frontend Integration', priority: 'High', assignee: 'FE' },
                  { title: 'API Documentation', priority: 'Low', assignee: 'BE' }
                ]
              },
              { 
                status: 'Review', 
                count: 5, 
                color: 'warning',
                tasks: [
                  { title: 'Security Audit', priority: 'High', assignee: 'DevOps' },
                  { title: 'Performance Testing', priority: 'Medium', assignee: 'QA' }
                ]
              },
              { 
                status: 'Done', 
                count: 34, 
                color: 'success',
                tasks: [
                  { title: 'User Authentication', priority: 'High', assignee: 'FE' },
                  { title: 'Database Schema', priority: 'Medium', assignee: 'BE' }
                ]
              }
            ].map((column, index) => (
              <motion.div
                key={column.status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`p-4 bg-${column.color}-500/10 border border-${column.color}-500/30 rounded-lg min-h-96`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold text-${column.color}-400`}>{column.status}</h3>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium bg-${column.color}-500/20 text-${column.color}-400`}>
                    {column.count}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {column.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <h4 className="text-sm font-medium text-white mb-2">{task.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'High' ? 'bg-danger-500/20 text-danger-400' :
                          task.priority === 'Medium' ? 'bg-warning-500/20 text-warning-400' :
                          'bg-success-500/20 text-success-400'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-slate-400">{task.assignee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Projects & Team Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Seneste Projekter</h2>
            
            <div className="space-y-4">
              {[
                {
                  name: 'AI Platform Development',
                  progress: 78,
                  team: 12,
                  deadline: '15 dage',
                  status: 'on-track'
                },
                {
                  name: 'Mobile App Redesign',
                  progress: 45,
                  team: 8,
                  deadline: '28 dage',
                  status: 'on-track'
                },
                {
                  name: 'Database Migration',
                  progress: 92,
                  team: 5,
                  deadline: '3 dage',
                  status: 'at-risk'
                }
              ].map((project, index) => (
                <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <p className="text-sm text-slate-400">{project.team} team members</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === 'on-track' ? 'bg-success-500/20 text-success-400' :
                      'bg-warning-500/20 text-warning-400'
                    }`}>
                      {project.deadline}
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        project.status === 'on-track' ? 'bg-gradient-to-r from-success-500 to-success-400' :
                        'bg-gradient-to-r from-warning-500 to-warning-400'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400">{project.progress}% gennemført</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Team Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Team Aktivitet</h2>
            
            <div className="space-y-4">
              {[
                {
                  user: 'Sarah Jensen',
                  action: 'completede opgave',
                  task: 'API Integration',
                  time: '15 min siden'
                },
                {
                  user: 'Mike Nielsen',
                  action: 'oprettede nyt projekt',
                  task: 'Mobile App v2.0',
                  time: '1 time siden'
                },
                {
                  user: 'Lisa Andersen',
                  action: 'kommenterede på',
                  task: 'Database Schema',
                  time: '2 timer siden'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-warning-500 to-warning-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                      <span className="text-warning-400">{activity.task}</span>
                    </p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-warning-500/10 border border-warning-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-warning-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-warning-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Project Management Integration</h3>
              <p className="text-slate-300 text-sm mb-4">
                AI Project Management integrerer med Jira, Asana, Monday.com og andre project management tools.
              </p>
              <Link to="/settings/integrations" className="text-warning-400 hover:text-warning-300 text-sm">
                Konfigurer integrationer →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
