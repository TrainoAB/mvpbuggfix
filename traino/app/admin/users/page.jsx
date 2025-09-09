'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '../hooks';
import { useAppState } from '@/app/hooks/useAppState';
import { getUser } from '@/app/functions/fetchDataFunctions.js';
import Loader from '@/app/components/Loader';

import AdminSearchInputs from './AdminSearchInputs';
import ListItem from './ListItem';
import Link from 'next/link';
import AdminNav from '@/app/admin/AdminNav';

import '../page.css';

export default function AdminUsers() {
  const { DEBUG, baseUrl, sessionObject } = useAppState();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ id: 0 });
  const [deleteUserId, setDeleteUserId] = useState('');
  async function searchFunction(search) {
    const user = await getUser(search);
    setUser(user);
  }

  return (
    <>
      <main id="admin-page">
        <AdminNav page="users" />
        <div className="searchbar">
          <input type="search" id="user-search" placeholder="Sök id/alias" className="search" />
          <button className="button" onClick={() => searchFunction(document.getElementById('user-search').value)}>
            Sök
          </button>
        </div>
        {user.id !== 0 && user.id !== undefined ? (
          <>
            <ListItem user={user} setDeleteUserId={setDeleteUserId} />

            {/* KOMMENTERA IN OM MER INFO SKA VISAS */}
            {/* <div className="presentationcontainer">
              <p>Name: {user.firstname} {user.lastname}</p>
              <p>Id: {user.id}</p>
              <p>Alias: {user.alias}</p>
              <p>Usertype: {user.usertype}</p>
              <p>Email: {user.email}</p>
              <p>Phone: {user.phone}</p>
              <p>Address: {user.user_address}</p>
              <p>Gender: {user.gender}</p>
              <p>Active: {user.active}</p>
              <p>Admin: {user.admin}</p>
              <p>Deleted: {user.deleted}</p>
          </div> */}
          </>
        ) : (
          <></>
        )}
        {user.id === undefined ? (
          <p>
            <br></br>
            <p>No users found</p>
          </p>
        ) : (
          <></>
        )}
      </main>
    </>
  );
}
