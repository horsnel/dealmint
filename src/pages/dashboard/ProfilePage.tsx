import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, Link as LinkIcon, Edit, CheckCircle, X, GraduationCap, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { compressImage } from '@/lib/image';
import { isValidNigerianPhone, normalizePhone } from '@/lib/validation';
import { usePageTitle } from '@/hooks/usePageTitle';

function isValidUrl(v: string) {
  if (!v) return true;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function ProfilePage() {
  usePageTitle('Profile');
  const { user, updateProfile, submitIdVerification, verifyStudent } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFileRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skillInput, setSkillInput] = useState('');
  const [idOpen, setIdOpen] = useState(false);
  const [idType, setIdType] = useState('');
  const [idFile, setIdFile] = useState<string>('');
  const [studentOpen, setStudentOpen] = useState(false);
  const [schoolEmail, setSchoolEmail] = useState('');
  const [studentError, setStudentError] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    website: user?.website || '',
    skills: user?.skills || [],
  });

  // Re-sync the form when the stored profile changes and we are not mid-edit
  useEffect(() => {
    if (user && !isEditing) {
      setProfile({
        name: user.name,
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        website: user.website || '',
        skills: user.skills || [],
      });
    }
  }, [user, isEditing]);

  if (!user) return null;

  const idVerified = user.idStatus === 'verified' || user.idVerified;
  const idPending = user.idStatus === 'pending';

  const startEdit = () => {
    setErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setSkillInput('');
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (profile.name.trim().length < 2) e.name = 'Enter your full name';
    if (!isValidNigerianPhone(profile.phone)) e.phone = 'Enter a valid Nigerian phone number';
    if (!isValidUrl(profile.website.trim())) e.website = 'Enter a valid website address';
    if (profile.bio.length > 500) e.bio = 'Keep your bio under 500 characters';
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    const phone = normalizePhone(profile.phone);
    const phoneChanged = phone !== user.phone;
    const site = profile.website.trim();
    updateProfile({
      name: profile.name.trim(),
      phone,
      location: profile.location.trim() || undefined,
      bio: profile.bio.trim() || undefined,
      website: site ? (/^https?:\/\//i.test(site) ? site : `https://${site}`) : undefined,
      skills: profile.skills,
      ...(phoneChanged ? { phoneVerified: false, isVerified: false } : {}),
    });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
    if (phoneChanged) toast.info('You changed your phone number, so it needs to be verified again');
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return void toast.error('Photos must be 8 MB or smaller');
    try {
      const data = await compressImage(f, 400, 0.85);
      updateProfile({ avatar: data });
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not use that photo');
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (s.length > 30) return void toast.error('Skills must be 30 characters or fewer');
    if (profile.skills.some((x) => x.toLowerCase() === s.toLowerCase())) return void toast.error('You already added that skill');
    if (profile.skills.length >= 12) return void toast.error('You can list up to 12 skills');
    setProfile({ ...profile, skills: [...profile.skills, s] });
    setSkillInput('');
  };

  const handleIdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      setIdFile(await compressImage(f, 600, 0.6));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read that file');
    }
  };

  const submitId = () => {
    if (!idType) return void toast.error('Choose the type of ID');
    if (!idFile) return void toast.error('Upload a clear photo of your ID');
    submitIdVerification();
    setIdOpen(false);
    setIdType('');
    setIdFile('');
    toast.success('ID submitted for review');
  };

  const submitStudent = () => {
    const res = verifyStudent(schoolEmail);
    if (!res.ok) return setStudentError(res.error);
    setStudentOpen(false);
    setSchoolEmail('');
    setStudentError('');
    toast.success('Student status verified. You now pay 10% commission.');
  };

  const inputClass = 'mt-1 dark:bg-violet-700 dark:border-violet-600';
  const fieldError = (k: string) =>
    errors[k] ? (
      <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">
        {errors[k]}
      </p>
    ) : null;

  const verifications = [
    {
      label: 'Phone Verification',
      verified: !!user.phoneVerified,
      pendingText: 'Pending',
      action: user.phoneVerified ? null : 'Verify Now',
      onAction: undefined as undefined | (() => void),
      href: '/verify-phone',
    },
    {
      label: 'ID Verification',
      verified: idVerified,
      pendingText: idPending ? 'In review' : 'Pending',
      action: idVerified || idPending ? null : 'Verify Now',
      onAction: () => setIdOpen(true),
      href: undefined as undefined | string,
    },
    {
      label: 'Student Status',
      verified: !!user.studentVerified,
      pendingText: 'Not verified',
      action: user.studentVerified ? null : 'Verify Now',
      onAction: () => setStudentOpen(true),
      href: undefined as undefined | string,
    },
  ];

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-6">
          Profile Settings
        </h1>

        {/* Profile Header */}
        <Card className="mb-6 dark:bg-violet-800 dark:border-violet-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={user.avatar || '/images/avatar_default.jpg'}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-500"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>

              <div className="text-center sm:text-left flex-1">
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  {user.phoneVerified && (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {user.role === 'student' && <Badge className="bg-violet-600 text-white">Student</Badge>}
                  {user.location && (
                    <Badge variant="secondary" className="dark:bg-violet-700 dark:text-gray-200">
                      <MapPin className="w-3 h-3 mr-1" />
                      {user.location}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isEditing && (
                  <Button variant="outline" onClick={cancelEdit} className="dark:border-violet-600 dark:text-white">
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={() => (isEditing ? handleSave() : startEdit())}
                  className={isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-violet-600 hover:bg-violet-700'}
                >
                  {isEditing ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="dark:bg-violet-800 dark:border-violet-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="p-name" className="dark:text-gray-200">Full Name</Label>
                <Input
                  id="p-name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className={inputClass}
                />
                {fieldError('name')}
              </div>

              <div>
                <Label htmlFor="p-email" className="dark:text-gray-200">Email</Label>
                <Input id="p-email" type="email" value={user.email} disabled className={inputClass} />
              </div>

              <div>
                <Label htmlFor="p-phone" className="dark:text-gray-200">Phone</Label>
                <Input
                  id="p-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  className={inputClass}
                />
                {fieldError('phone')}
              </div>

              <div>
                <Label htmlFor="p-location" className="dark:text-gray-200">Location</Label>
                <Input
                  id="p-location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., Lagos, Nigeria"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="p-site" className="dark:text-gray-200">Website/Portfolio</Label>
                <div className="relative mt-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="p-site"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                    className="pl-10 dark:bg-violet-700 dark:border-violet-600"
                  />
                </div>
                {fieldError('website')}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="p-bio" className="dark:text-gray-200">Bio</Label>
                <Textarea
                  id="p-bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell people what you do and what makes you great to work with"
                  className={inputClass}
                />
                <div className="flex justify-between">
                  {fieldError('bio') || <span />}
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{profile.bio.length}/500</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="dark:text-gray-200">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.length === 0 && !isEditing && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No skills added yet.</p>
                  )}
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="dark:bg-violet-700 dark:text-gray-200">
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          onClick={() => setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) })}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2 mt-3 max-w-sm">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Add a skill"
                      aria-label="Add a skill"
                      className="dark:bg-violet-700 dark:border-violet-600"
                    />
                    <Button type="button" variant="outline" onClick={addSkill} className="dark:border-violet-600 dark:text-white">
                      + Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
              Want to change your password or privacy options?{' '}
              <Link to="/dashboard/settings" className="text-violet-600 dark:text-amber-400 underline">
                Open Settings
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card className="mt-6 dark:bg-violet-800 dark:border-violet-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verifications.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-4 rounded-lg bg-gray-50 dark:bg-violet-700/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        item.verified ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}
                    >
                      <CheckCircle
                        className={`w-4 h-4 ${
                          item.verified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                    </div>
                    <span className="text-gray-900 dark:text-white leading-snug">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-auto">
                    <Badge className={item.verified ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                      {item.verified ? 'Verified' : item.pendingText}
                    </Badge>
                    {item.action &&
                      (item.href ? (
                        <Link to={item.href} state={{ from: '/dashboard/profile' }}>
                          <Button size="sm" className="bg-violet-600 hover:bg-violet-700">{item.action}</Button>
                        </Link>
                      ) : (
                        <Button size="sm" onClick={item.onAction} className="bg-violet-600 hover:bg-violet-700">
                          {item.action}
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ID verification */}
      <Dialog open={idOpen} onOpenChange={setIdOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Verify your ID</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Upload a clear photo of a government-issued ID to earn the verified ID badge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="dark:text-gray-200">ID type</Label>
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Choose an ID" />
                </SelectTrigger>
                <SelectContent>
                  {['National ID card', "Driver's licence", 'International passport', "Voter's card"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <input ref={idFileRef} type="file" accept="image/*" className="hidden" onChange={handleIdFile} />
              {idFile ? (
                <div className="relative">
                  <img src={idFile} alt="ID preview" className="w-full max-h-48 object-contain rounded-lg border dark:border-violet-600" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => idFileRef.current?.click()}
                    className="mt-2 dark:border-violet-600 dark:text-white"
                  >
                    Replace photo
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => idFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-violet-600 rounded-xl p-8 text-center hover:border-violet-500 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Click to upload a photo of your ID</p>
                </button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIdOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={submitId} className="bg-violet-600 hover:bg-violet-700">
              Submit for review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student verification */}
      <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Verify student status
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Students pay 10% commission instead of 15%. Use your school email ending in .edu.ng or .edu.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="school-email" className="dark:text-gray-200">School email</Label>
            <Input
              id="school-email"
              type="email"
              value={schoolEmail}
              onChange={(e) => {
                setSchoolEmail(e.target.value);
                setStudentError('');
              }}
              placeholder="you@unilag.edu.ng"
              className={inputClass}
            />
            {studentError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">{studentError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setStudentOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={submitStudent} className="bg-violet-600 hover:bg-violet-700">
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
