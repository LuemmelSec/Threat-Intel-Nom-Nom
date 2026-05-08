import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { statsApi, alertsApi, feedsApi, keywordsApi } from '../api/client';

// Color scheme for criticality levels
const CRITICALITY_COLORS = {
  low: '#2196f3',      // Blue
  medium: '#ff9800',   // Orange
  high: '#f44336',     // Red
  critical: '#9c27b0', // Purple
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [keywordData, setKeywordData] = useState([]);
  const [recentFeeds, setRecentFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await statsApi.get();
      setStats(statsResponse.data);

      // Fetch recent alerts
      const alertsResponse = await alertsApi.getAll({ limit: 5 });
      setRecentAlerts(alertsResponse.data);

      // Calculate alerts per keyword
      const allAlertsResponse = await alertsApi.getAll({ limit: 1000 });

      // Build keyword ID -> name lookup from current keywords
      const kwResponse = await keywordsApi.getAll();
      const kwLookup = {};
      kwResponse.data.forEach(k => { kwLookup[k.id] = k.name || k.keyword; });

      const keywordCounts = {};

      allAlertsResponse.data.forEach(alert => {
        // matched_keywords is an array of {id, keyword, name?, ...} objects
        const keywords = alert.matched_keywords || [];
        if (keywords.length > 0) {
          keywords.forEach(kw => {
            const name = kwLookup[kw.id] || kw.name || kw.keyword || 'unknown';
            keywordCounts[name] = (keywordCounts[name] || 0) + 1;
          });
        } else {
          // fallback: use keyword lookup by alert's keyword_id, then keyword object name, then matched_content
          const name = kwLookup[alert.keyword?.id] || alert.keyword?.name || alert.keyword?.keyword || alert.matched_content || 'unknown';
          keywordCounts[name] = (keywordCounts[name] || 0) + 1;
        }
      });

      const kwData = Object.entries(keywordCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setKeywordData(kwData);

      // Fetch recent feeds
      const feedsResponse = await feedsApi.getAll({ limit: 100 });
      const sortedFeeds = feedsResponse.data
        .filter(feed => feed.last_fetched)
        .sort((a, b) => new Date(b.last_fetched) - new Date(a.last_fetched))
        .slice(0, 5);
      setRecentFeeds(sortedFeeds);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getCriticalityColor = (level) => {
    return CRITICALITY_COLORS[level?.toLowerCase()] || CRITICALITY_COLORS.medium;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Threat Intelligence Dashboard
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' }
            }}
            onClick={() => navigate('/alerts')}
          >
            <CardContent>
              <Typography color="white" variant="h3">
                {stats?.total_alerts || 0}
              </Typography>
              <Typography color="white" variant="body2">
                Total Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' }
            }}
            onClick={() => navigate('/alerts?status=unread')}
          >
            <CardContent>
              <Typography color="white" variant="h3">
                {stats?.unread_alerts || 0}
              </Typography>
              <Typography color="white" variant="body2">
                Unread Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' }
            }}
            onClick={() => navigate('/feeds')}
          >
            <CardContent>
              <Typography color="white" variant="h3">
                {stats?.healthy_feeds || 0}/{stats?.active_feeds || 0}
              </Typography>
              <Typography color="white" variant="body2">
                Healthy Active Feeds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' }
            }}
            onClick={() => navigate('/keywords')}
          >
            <CardContent>
              <Typography color="white" variant="h3">
                {stats?.active_keywords || 0}
              </Typography>
              <Typography color="white" variant="body2">
                Active Keywords
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Keywords by Alerts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Top Keywords by Alerts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {keywordData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={keywordData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Alerts" radius={[0, 4, 4, 0]}>
                    {keywordData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#1e88e5', '#43a047', '#fb8c00', '#e53935', '#8e24aa',
                        '#00acc1', '#7cb342', '#f4511e', '#6d4c41', '#546e7a'
                      ][index % 10]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  No alerts yet
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Alerts Feed */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Latest Alerts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentAlerts.length > 0 ? (
              <List>
                {recentAlerts.map((alert, index) => {
                  const articleTitle = alert.api_metadata?.article_title;
                  const articleLink = alert.api_metadata?.article_link;
                  const mkw = alert.matched_keywords;
                  const keywords = (mkw && mkw.length > 0)
                    ? mkw.map(k => k.name || k.keyword)
                    : [alert.keyword?.name || alert.keyword?.keyword || 'Unknown'];
                  return (
                  <React.Fragment key={alert.id}>
                    <ListItem
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1,
                        mb: 1,
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      }}
                      onClick={() => navigate('/alerts')}
                    >
                      {/* Row 1: criticality + keywords + time */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', mb: 0.5 }}>
                        <Chip
                          label={alert.criticality?.toUpperCase() || 'MEDIUM'}
                          size="small"
                          sx={{
                            backgroundColor: getCriticalityColor(alert.criticality),
                            color: 'white',
                            fontWeight: 'bold',
                            minWidth: 70,
                          }}
                        />
                        {keywords.map((kw, ki) => (
                          <Chip key={ki} label={kw} size="small" color="primary" variant="outlined" />
                        ))}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
                          {formatTimestamp(alert.triggered_at)}
                        </Typography>
                      </Box>
                      {/* Row 2: article title with link */}
                      {articleTitle && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          {articleLink ? (
                            <Link
                              href={articleLink}
                              target="_blank"
                              rel="noopener"
                              underline="hover"
                              color="primary"
                              variant="body2"
                              sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.3 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {articleTitle}
                              <OpenInNewIcon sx={{ fontSize: 12 }} />
                            </Link>
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {articleTitle}
                            </Typography>
                          )}
                        </Box>
                      )}
                      {/* Row 3: feed name */}
                      <Typography variant="caption" color="text.secondary">
                        {alert.feed?.name || 'Unknown Feed'}
                        {alert.feed?.feed_type ? ` (${alert.feed.feed_type})` : ''}
                      </Typography>
                    </ListItem>
                    {index < recentAlerts.length - 1 && <Divider />}
                  </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent alerts
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Feed Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Feed Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentFeeds.length > 0 ? (
              <Grid container spacing={2}>
                {recentFeeds.map((feed) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={feed.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 6 },
                        transition: 'box-shadow 0.3s',
                      }}
                      onClick={() => navigate('/feeds')}
                    >
                      <CardContent>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          {feed.name}
                        </Typography>
                        <Chip
                          label={feed.feed_type?.toUpperCase() || 'UNKNOWN'}
                          size="small"
                          sx={{ mt: 1, mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          Last checked: {formatTimestamp(feed.last_fetched)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No feed activity yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Suggestions for Future Enhancements (Hidden Comment) */}
      {/* 
        Additional widgets that would make sense here:
        1. Alert Timeline - Line/Bar chart showing alerts over the last 7/30 days
        2. Top Keywords - Most frequently matched keywords (Top 5-10)
        3. Feed Health Status - Shows which feeds are failing, slow, or working well
        4. Threat Heatmap - Geographic distribution if feeds include location data
        5. Alert Response Time - Average time to mark alerts as read
        6. Keyword Cloud - Visual representation of keyword frequency
        7. Recent Notifications - Last 5 sent notifications with status
        8. System Health - CPU, Memory, Database size metrics
        9. Feed Category Distribution - Pie chart of feed types (RSS, Onion, Website, Telegram)
        10. Critical Alerts Timeline - Dedicated view for critical alerts only
      */}
    </Box>
  );
}

export default Dashboard;
