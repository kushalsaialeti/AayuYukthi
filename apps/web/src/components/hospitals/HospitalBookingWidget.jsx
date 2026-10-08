import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function HospitalBookingWidget({ hospital }) {
  const navigate = useNavigate();

  // Package state: 'half' or 'full'
  const [pkg, setPkg] = useState('half');

  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(tomorrowStr);
  const [time, setTime] = useState('09:30 AM');
  const [recipient, setRecipient] = useState('Elderly Parent (Father / Mother)');

  const lead = hospital?.station_lead && typeof hospital.station_lead === 'object' && hospital.station_lead.name
    ? hospital.station_lead
    : null;

  const phone = hospital?.contact_phone || '180022982273';
  const visitingHours = hospital?.visiting_hours_en || '10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM';
  const parkingInfo = hospital?.parking_info_en || 'Available at Gate 1 & Gate 4 (Valet Available)';
  const pharmacyInfo = hospital?.pharmacy_info_en || '24/7 Service on Ground Floor';

  const handleBooking = (e) => {
    e.preventDefault();
    const query = new URLSearchParams({
      hospital: hospital?.slug || '',
      package: pkg,
      date,
      time,
      recipient,
    });
    navigate(`/request-care?${query.toString()}`);
  };

  return (
    <div className="hsp-sidebar-sticky">
      {/* 1. Quick Booking Card */}
      <div className="hsp-booking-card" id="booking-widget">
        <div className="hsp-booking-badge-row">
          <span className="hsp-booking-immediate-badge">Immediate Booking</span>
        </div>

        <h2 className="hsp-booking-title">
          Book Accompaniment at {hospital?.name_en}
        </h2>
        <p className="hsp-booking-desc">
          Dedicated personal guide at {hospital?.city ? `${hospital.city} campus` : 'hospital'}.
        </p>

        <form onSubmit={handleBooking} className="hsp-booking-form">
          {/* Facility Read-only */}
          <div className="hsp-form-group">
            <label className="hsp-form-label">Destination Facility</label>
            <div className="hsp-destination-preview">
              <Icon name="local_hospital" size={20} className="text-primary shrink-0" />
              <span className="hsp-destination-name">{hospital?.name_en}</span>
            </div>
          </div>

          {/* Package Duration Selector */}
          <div className="hsp-form-group">
            <label className="hsp-form-label">Care Package Duration</label>
            <div className="hsp-package-grid">
              <button
                type="button"
                className={`hsp-package-btn ${pkg === 'half' ? 'is-active' : ''}`}
                onClick={() => setPkg('half')}
              >
                <div className="hsp-package-type">Half-Day</div>
                <div className="hsp-package-hours">Up to 4 hours</div>
                <div className="hsp-package-price">₹1,299</div>
              </button>

              <button
                type="button"
                className={`hsp-package-btn ${pkg === 'full' ? 'is-active' : ''}`}
                onClick={() => setPkg('full')}
              >
                <div className="hsp-package-type">Full-Day</div>
                <div className="hsp-package-hours">Up to 8 hours</div>
                <div className="hsp-package-price">₹2,199</div>
              </button>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="hsp-form-row-2">
            <div className="hsp-form-group">
              <label className="hsp-form-label">Visit Date</label>
              <input
                type="date"
                className="hsp-form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="hsp-form-group">
              <label className="hsp-form-label">Arrival Time</label>
              <select
                className="hsp-form-select"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                <option value="08:30 AM">08:30 AM</option>
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="01:30 PM">01:30 PM</option>
                <option value="03:30 PM">03:30 PM</option>
              </select>
            </div>
          </div>

          {/* Accompaniment Recipient */}
          <div className="hsp-form-group">
            <label className="hsp-form-label">Accompaniment For</label>
            <select
              className="hsp-form-select"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              <option value="Elderly Parent (Father / Mother)">Elderly Parent (Father / Mother)</option>
              <option value="Self (Independent patient)">Self (Independent patient)</option>
              <option value="Spouse / Partner">Spouse / Partner</option>
              <option value="Child / Adolescent">Child / Adolescent</option>
              <option value="Other Relative">Other Relative</option>
            </select>
          </div>

          {/* Submit Button */}
          <button type="submit" className="hsp-btn-booking-submit">
            <span>Request Care at {hospital?.name_en}</span>
            <Icon name="arrow_forward" size={18} />
          </button>

          <p className="hsp-booking-guarantee-note">
            Zero cancellation charge up to 6 hours before slot. Background-verified companions with photo identification.
          </p>
        </form>
      </div>

      {/* 2. Facility Station Lead Coordinator Card */}
      {lead && (
        <div className="hsp-station-lead-card">
          <div className="hsp-lead-eyebrow">Facility Station Lead</div>
          <div className="hsp-lead-profile-row">
            {lead.avatar_url ? (
              <img
                src={lead.avatar_url}
                alt={lead.name}
                className="hsp-lead-avatar"
              />
            ) : (
              <div className="hsp-lead-avatar-placeholder">
                <Icon name="person" size={28} />
              </div>
            )}
            <div className="hsp-lead-profile-meta">
              <h3 className="hsp-lead-name">{lead.name}</h3>
              <p className="hsp-lead-role">{lead.role || 'Senior Coordinator'}</p>
              {lead.rating && (
                <div className="hsp-lead-rating-row">
                  <Icon name="star" size={16} filled className="text-amber" />
                  <strong>{lead.rating} Rating</strong>
                  {lead.visits && <span className="hsp-lead-visits">• {lead.visits}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="hsp-lead-badges-list">
            {lead.languages && (
              <div className="hsp-lead-badge-item">
                <Icon name="translate" size={16} className="text-secondary" />
                <span>{lead.languages}</span>
              </div>
            )}
            {lead.certification && (
              <div className="hsp-lead-badge-item">
                <Icon name="medical_information" size={16} className="text-secondary" />
                <span>{lead.certification}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Immediate On-Duty Desk Help */}
      <div className="hsp-urgent-help-card">
        <div className="hsp-urgent-title-row">
          <Icon name="emergency" size={22} className="text-cyan" />
          <span className="hsp-urgent-title">Need Assistance Today?</span>
        </div>
        <p className="hsp-urgent-desc">
          Visiting {hospital?.name_en} in the next 2 hours? Call our dedicated on-campus coordinator desk.
        </p>
        <a href={`tel:${phone}`} className="hsp-btn-urgent-call">
          <Icon name="phone_in_talk" size={20} />
          <span>Call Desk: {phone}</span>
        </a>
      </div>

      {/* 4. Practical Campus Details Box */}
      <div className="hsp-logistics-card">
        <h3 className="hsp-logistics-title">Practical Campus Details</h3>

        <div className="hsp-logistics-row">
          <Icon name="schedule" size={18} className="text-secondary" />
          <div>
            <div className="hsp-logistics-label">Visiting Hours:</div>
            <div className="hsp-logistics-val">{visitingHours}</div>
          </div>
        </div>

        <div className="hsp-logistics-row">
          <Icon name="local_parking" size={18} className="text-secondary" />
          <div>
            <div className="hsp-logistics-label">Valet &amp; Parking:</div>
            <div className="hsp-logistics-val">{parkingInfo}</div>
          </div>
        </div>

        <div className="hsp-logistics-row">
          <Icon name="local_pharmacy" size={18} className="text-secondary" />
          <div>
            <div className="hsp-logistics-label">Central Pharmacy:</div>
            <div className="hsp-logistics-val">{pharmacyInfo}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
