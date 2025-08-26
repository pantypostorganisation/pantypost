// pantypost-backend/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedUser: {
    type: String,
    required: true,
    index: true
  },
  reportedBy: {
    type: String,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['harassment', 'spam', 'inappropriate_content', 'scam', 'other'],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  evidence: [{
    type: String,
    maxLength: 500
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  adminNotes: {
    type: String,
    maxLength: 2000
  },
  category: {
    type: String,
    enum: ['verified', 'spam', 'abuse', 'fake', 'other'],
    default: 'other'
  },
  processedBy: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  banApplied: {
    type: Boolean,
    default: false
  },
  relatedMessageId: {
    type: String,
    default: null
  },
  reportCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
reportSchema.index({ reportedUser: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1, createdAt: -1 });
reportSchema.index({ status: 1, severity: 1 });
reportSchema.index({ createdAt: -1 });

// Instance methods
reportSchema.methods.process = async function(adminUsername, action, banApplied = false) {
  this.status = action === 'resolve' ? 'resolved' : 'dismissed';
  this.processedBy = adminUsername;
  this.processedAt = new Date();
  this.banApplied = banApplied;
  return this.save();
};

reportSchema.methods.updateStatus = async function(newStatus, adminUsername) {
  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid status');
  }
  
  this.status = newStatus;
  if (newStatus === 'resolved' || newStatus === 'dismissed') {
    this.processedBy = adminUsername;
    this.processedAt = new Date();
  }
  return this.save();
};

reportSchema.methods.addAdminNote = async function(note, adminUsername) {
  const timestamp = new Date().toISOString();
  const noteWithMetadata = `[${timestamp} - ${adminUsername}]\n${note}\n\n`;
  this.adminNotes = (this.adminNotes || '') + noteWithMetadata;
  return this.save();
};

// Static methods
reportSchema.statics.submitReport = async function(reportData) {
  // Check for duplicate reports
  const existingReport = await this.findOne({
    reportedUser: reportData.reportedUser,
    reportedBy: reportData.reportedBy,
    reportType: reportData.reportType,
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within 24 hours
  });

  if (existingReport) {
    // Increment report count instead of creating duplicate
    existingReport.reportCount += 1;
    if (reportData.description && !existingReport.description.includes(reportData.description)) {
      existingReport.description += '\n\n---\n' + reportData.description;
    }
    return existingReport.save();
  }

  return this.create(reportData);
};

reportSchema.statics.getReportStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        statusCounts: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        severityCounts: [
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ],
        typeCounts: [
          { $group: { _id: '$reportType', count: { $sum: 1 } } }
        ],
        recentReports: [
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          },
          { $count: 'count' }
        ],
        criticalPending: [
          {
            $match: {
              status: 'pending',
              severity: 'critical'
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ]);

  return {
    statusBreakdown: stats[0].statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    severityBreakdown: stats[0].severityCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    typeBreakdown: stats[0].typeCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    recentReports24h: stats[0].recentReports[0]?.count || 0,
    criticalPending: stats[0].criticalPending[0]?.count || 0
  };
};

reportSchema.statics.getUserReportHistory = async function(username) {
  return this.find({
    $or: [
      { reportedUser: username },
      { reportedBy: username }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;